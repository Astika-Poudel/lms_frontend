import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { FaRegCreditCard, FaCalendarAlt, FaLock } from "react-icons/fa";
import { CourseData } from "../../context/CourseContext";

const stripePromise = loadStripe("pk_test_51QlN4iG11lLG2hVXLdZhuzJw24mf5grQNHAr4026e3rQV66czR2UCRJQgBrhbkFnRkE5elHkiNiMLdBCfFxLaQyU00w3pHsstP");

const PaymentForm = ({ amount, courseTitle }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.post("http://localhost:7001/api/payment/create-payment-intent", { amount });

            if (!stripe || !elements) return;

            const cardElement = elements.getElement(CardNumberElement);
            if (!cardElement) {
                setError("Card details are missing.");
                setLoading(false);
                return;
            }

            const paymentResult = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: "Test User", // Replace with actual user data
                    },
                },
            });

            if (paymentResult.error) {
                setError(paymentResult.error.message);
            } else {
                setSuccess(true);
                setTimeout(() => navigate("/student/course/all"), 3000);
            }
        } catch (err) {
            setError("Payment failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                    <label className="block">Card Number</label>
                    <div className="flex p-3 border rounded">
                        <FaRegCreditCard className="mr-2" />
                        <CardNumberElement className="flex-1" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block">Expiry Date</label>
                        <div className="flex p-3 border rounded">
                            <FaCalendarAlt className="mr-2" />
                            <CardExpiryElement className="flex-1" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block">CVC</label>
                        <div className="flex p-3 border rounded">
                            <FaLock className="mr-2" />
                            <CardCvcElement className="flex-1" />
                        </div>
                    </div>
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded" disabled={loading}>
                    {loading ? "Processing..." : `Pay NPR ${amount}`}
                </button>
            </form>
            {success && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg text-center">
                        <h2 className="text-green-600 text-xl font-bold">Payment Successful!</h2>
                        <p className="text-gray-700">You are now enrolled in <strong>{courseTitle}</strong>.</p>
                        <button onClick={() => navigate("/student/course/all")} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                            Go to Courses
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentPage = () => {
    const { id } = useParams();
    const { courses } = CourseData();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [khaltiLoaded, setKhaltiLoaded] = useState(false);
    const [khaltiError, setKhaltiError] = useState(null);

    useEffect(() => {
        if (courses.length > 0) {
            const foundCourse = courses.find((c) => c._id === id);
            if (foundCourse) setCourse(foundCourse);
            else navigate("/student/course/all");
        }
    }, [id, courses, navigate]);

    // Check if Khalti SDK is loaded only when needed
    useEffect(() => {
        if (paymentMethod === "khalti") {
            if (window.KhaltiCheckout) {
                setKhaltiLoaded(true);
                setKhaltiError(null);
            } else {
                setKhaltiLoaded(false);
                setKhaltiError("Khalti payment SDK not loaded.");
            }
        }
    }, [paymentMethod]);

    const handleKhaltiPayment = async () => {
        setPaymentMethod("khalti");
        
        // If Khalti is not already checked, this will trigger the useEffect above
        if (!khaltiLoaded && !window.KhaltiCheckout) {
            return; // The useEffect will set the error message
        }

        try {
            const { data } = await axios.get("http://localhost:7001/api/payment/khalti", { params: { amount: course.price } });

            const config = {
                publicKey: "your-khalti-public-key",
                productIdentity: id,
                productName: course.title,
                productUrl: window.location.href,
                eventHandler: {
                    onSuccess() {
                        alert("Payment Successful!");
                        navigate("/student/course/all");
                    },
                    onError() {
                        alert("Payment Failed!");
                    },
                },
                paymentPreference: ["KHALTI"],
            };

            new window.KhaltiCheckout(config).show({ amount: data.amount * 100 });
        } catch (error) {
            setKhaltiError("Failed to initiate Khalti payment.");
        }
    };

    if (!course) return <p>Loading...</p>;

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-6 rounded shadow w-full max-w-lg">
                <h2 className="text-xl font-bold text-center">Enroll in {course.title}</h2>
                <p className="text-center text-gray-600">Price: NPR {course.price}</p>
                
                {/* Payment method selection */}
                {!paymentMethod && (
                    <div className="flex flex-col items-center my-6">
                        <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setPaymentMethod("stripe")} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
                                Pay with Stripe
                            </button>
                            <button onClick={handleKhaltiPayment} className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition">
                                Pay with Khalti
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Stripe payment form */}
                {paymentMethod === "stripe" && (
                    <div className="mt-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-medium">Pay with Stripe</h3>
                            <button 
                                onClick={() => setPaymentMethod(null)} 
                                className="text-blue-500 hover:underline"
                            >
                                Change method
                            </button>
                        </div>
                        <Elements stripe={stripePromise}>
                            <PaymentForm amount={course.price} courseTitle={course.title} />
                        </Elements>
                    </div>
                )}
                
                {/* Khalti payment section */}
                {paymentMethod === "khalti" && (
                    <div className="mt-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-medium">Pay with Khalti</h3>
                            <button 
                                onClick={() => {
                                    setPaymentMethod(null);
                                    setKhaltiError(null);
                                }} 
                                className="text-blue-500 hover:underline"
                            >
                                Change method
                            </button>
                        </div>
                        
                        {khaltiError ? (
                            <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded mb-4">
                                <p>{khaltiError}</p>
                                <button 
                                    onClick={() => setPaymentMethod(null)} 
                                    className="mt-2 text-blue-500 hover:underline"
                                >
                                    Try another payment method
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <p>Processing your Khalti payment...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;