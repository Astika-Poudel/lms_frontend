import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from "@stripe/react-stripe-js";
import axios from "axios";
import { FaRegCreditCard, FaCalendarAlt, FaLock, FaUser, FaClock, FaTag, FaArrowLeft } from "react-icons/fa";
import { CourseData } from "../../context/CourseContext";
import { EnrollData } from "../../context/enrollContext";

const stripePromise = loadStripe("pk_test_51QlN4iG11lLG2hVXLdZhuzJw24mf5grQNHAr4026e3rQV66czR2UCRJQgBrhbkFnRkE5elHkiNiMLdBCfFxLaQyU00w3pHsstP");

const PaymentForm = ({ amount, courseId, courseTitle }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { enrollInCourse } = EnrollData();

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please log in to proceed with payment.");
                setLoading(false);
                return;
            }

            const { data } = await axios.post(
                "http://localhost:7001/api/payment/create-payment-intent",
                { amount },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!stripe || !elements) {
                setError("Stripe or elements not initialized.");
                setLoading(false);
                return;
            }

            const cardElement = elements.getElement(CardNumberElement);
            if (!cardElement) {
                setError("Card details are missing.");
                setLoading(false);
                return;
            }

            const paymentResult = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: { name: "Test User" },
                },
            });

            if (paymentResult.error) {
                setError(paymentResult.error.message);
            } else {
                await enrollInCourse(courseId);
                setSuccess(true);
                setTimeout(() => navigate("/student/courses"), 3000);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Payment failed. Please try again.";
            setError(errorMessage);
            console.error("Payment error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">Card Number</label>
                    <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <FaRegCreditCard className="text-gray-500 mr-3" />
                        <CardNumberElement className="flex-1 text-gray-800" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="block text-gray-700 font-medium">Expiry Date</label>
                        <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <FaCalendarAlt className="text-gray-500 mr-3" />
                            <CardExpiryElement className="flex-1 text-gray-800" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="block text-gray-700 font-medium">CVC</label>
                        <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <FaLock className="text-gray-500 mr-3" />
                            <CardCvcElement className="flex-1 text-gray-800" />
                        </div>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-[#134e4a] text-white py-3 rounded-lg hover:bg-[#0c3c38] transition duration-300 font-medium"
                    disabled={loading}
                >
                    {loading ? "Processing..." : `Pay NPR ${amount}`}
                </button>
            </form>
            {success && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
                        <h2 className="text-green-600 text-2xl font-bold mb-2">Payment Successful!</h2>
                        <p className="text-gray-700 mb-4">
                            You are now enrolled in <strong>{courseTitle}</strong>.
                        </p>
                        <button
                            onClick={() => navigate("/student/courses")}
                            className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
                        >
                            Go to My Courses
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
    const [esewaLoaded, setEsewaLoaded] = useState(false);
    const [esewaError, setEsewaError] = useState(null);

    useEffect(() => {
        if (courses.length > 0) {
            const foundCourse = courses.find((c) => c._id === id);
            if (foundCourse) setCourse(foundCourse);
            else navigate("/student/course/all");
        }
    }, [id, courses, navigate]);

    useEffect(() => {
        if (paymentMethod === "esewa") {
            // Simulate Esewa SDK check (replace with actual Esewa SDK integration if available)
            setEsewaLoaded(true);
            setEsewaError(null);
        }
    }, [paymentMethod]);

    const handleEsewaPayment = async () => {
        setPaymentMethod("esewa");
        if (!esewaLoaded) return;

        try {
            // Simulate Esewa payment initiation (replace with actual Esewa API call)
            const { data } = await axios.get("http://localhost:7001/api/payment/esewa", { params: { amount: course.price } });
            // Simulate Esewa payment flow
            setTimeout(() => {
                enrollUserInCourse(id);
                alert("Payment Successful with Esewa!");
                navigate("/student/courses");
            }, 2000);
        } catch (error) {
            setEsewaError("Failed to initiate Esewa payment.");
        }
    };

    const enrollUserInCourse = async (courseId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:7001/api/user/enroll-course",
                { courseId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error("Error enrolling in course:", error);
        }
    };

    const handleBack = () => {
        navigate(-1); // Navigate to the previous page
    };

    if (!course) return <p className="text-center text-gray-600 text-lg mt-10">Loading...</p>;

    return (
        <div className="flex justify-center min-h-screen bg-gray-50 p-6 pt-20">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md relative">
                <button
                    onClick={handleBack}
                    className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-800 transition duration-300"
                >
                    <FaArrowLeft className="mr-2" />
                    Back
                </button>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Enroll in {course.title}
                </h2>
                <p className="text-center text-gray-600 mb-4">Price: NPR {course.price}</p>
                <div className="border-t border-gray-200 pt-4 mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Course Details</h3>
                    <div className="space-y-2 text-gray-600">
                        <div className="flex items-center">
                            <FaUser className="text-[#134e4a] mr-2" />
                            <p><span className="font-medium">Tutor:</span> {course.tutor || "Not specified"}</p>
                        </div>
                        <div className="flex items-center">
                            <FaClock className="text-[#134e4a] mr-2" />
                            <p><span className="font-medium">Duration:</span> {course.duration} Month{course.duration > 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center">
                            <FaTag className="text-[#134e4a] mr-2" />
                            <p><span className="font-medium">Category:</span> {course.category}</p>
                        </div>
                    </div>
                </div>
                {!paymentMethod && (
                    <div className="flex flex-col items-center my-6">
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Select Payment Method</h3>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                            <button
                                onClick={() => setPaymentMethod("stripe")}
                                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-300 font-medium w-full sm:w-auto"
                            >
                                Pay with Stripe
                            </button>
                            <button
                                onClick={handleEsewaPayment}
                                className="bg-[#134e4a] text-white px-6 py-3 rounded-lg hover:bg-[#0c3c38] transition duration-300 font-medium w-full sm:w-auto"
                            >
                                Pay with Esewa
                            </button>
                        </div>
                    </div>
                )}
                {paymentMethod === "stripe" && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Pay with Stripe</h3>
                            <button
                                onClick={() => setPaymentMethod(null)}
                                className="text-[#134e4a] hover:underline text-sm"
                            >
                                Change Method
                            </button>
                        </div>
                        <Elements stripe={stripePromise}>
                            <PaymentForm amount={course.price} courseId={course._id} courseTitle={course.title} />
                        </Elements>
                    </div>
                )}
                {paymentMethod === "esewa" && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-700">Pay with Esewa</h3>
                            <button
                                onClick={() => { setPaymentMethod(null); setEsewaError(null); }}
                                className="text-[#134e4a] hover:underline text-sm"
                            >
                                Change Method
                            </button>
                        </div>
                        {esewaError ? (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-4">
                                <p>{esewaError}</p>
                                <button
                                    onClick={() => setPaymentMethod(null)}
                                    className="mt-2 text-[#134e4a] hover:underline text-sm"
                                >
                                    Try Another Payment Method
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-4 text-gray-600">
                                <p>Processing your Esewa payment...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;