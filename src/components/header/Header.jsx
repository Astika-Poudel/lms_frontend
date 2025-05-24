import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogPanel } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/20/solid';
import logo from '../../assets/logo.png';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white text-teal-900 shadow-md py-4">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo Section */}
        <div className="flex lg:flex-1 items-center justify-start">
          <Link to="/" className="flex items-center text-xl font-bold text-navy-900">
            <img src={logo} alt="LearnNepal Logo" className="h-16 w-auto mr-2" />
            LearnNepal
          </Link>
        </div>

        {/* Mobile Menu Icon */}
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-teal-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        {/* Sign Up and Login Links */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link to="/register" className="bg-yellow-400 text-black py-2 px-4 rounded-md text-sm font-semibold hover:bg-yellow-500 transition-colors">
            Sign Up
          </Link>
          <Link to="/login" className="ml-6 bg-black text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-teal-500 transition-colors">
            Login
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-teal-50 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-teal-900/10">
          <div className="flex items-center justify-between">
            <Link to="/" className="mx-auto text-center text-3xl font-bold text-teal-600">
              LearnNepal
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-teal-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-teal-500/10">
              <div className="py-6">
                <Link to="/register" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-teal-900 hover:bg-teal-50">
                  Sign Up
                </Link>
                <Link to="/login" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold text-teal-900 hover:bg-teal-50">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}