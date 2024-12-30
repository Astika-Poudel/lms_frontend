import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react';
import { ChevronDownIcon, Bars3Icon, XMarkIcon, PlayCircleIcon, PhoneIcon } from '@heroicons/react/20/solid';
import { ChartPieIcon, CursorArrowRaysIcon, FingerPrintIcon } from '@heroicons/react/24/outline';

const courses = [
  { name: 'Course 1', description: 'Learn the basics', href: '#', icon: ChartPieIcon },
  { name: 'Course 2', description: 'Advanced topics', href: '#', icon: CursorArrowRaysIcon },
  { name: 'Course 3', description: 'Mastery course', href: '#', icon: FingerPrintIcon },
];

const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white text-teal-900 shadow-md">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 text-2xl font-bold text-navy-900"> {/* Logo color changed to navy blue */}
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

        {/* Main Menu */}
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          <Popover className="relative">
            <PopoverButton className="flex items-center gap-x-1 text-sm font-semibold text-teal-900">
              Courses
              <ChevronDownIcon aria-hidden="true" className="h-5 w-5 text-teal-400" />
            </PopoverButton>
            <PopoverPanel className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-teal-900/5">
              <div className="p-4">
                {courses.map((item) => (
                  <div key={item.name} className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm hover:bg-teal-50">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 group-hover:bg-white">
                      <item.icon aria-hidden="true" className="h-6 w-6 text-teal-600 group-hover:text-teal-700" />
                    </div>
                    <div className="flex-auto">
                      <a href={item.href} className="block font-semibold text-teal-900">
                        {item.name}
                        <span className="absolute inset-0" />
                      </a>
                      <p className="mt-1 text-teal-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 divide-x divide-teal-900/5 bg-teal-50">
                {callsToAction.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-teal-900 hover:bg-teal-100"
                  >
                    <item.icon aria-hidden="true" className="h-5 w-5 text-teal-400" />
                    {item.name}
                  </a>
                ))}
              </div>
            </PopoverPanel>
          </Popover>
          <Link to="/about-us" className="text-sm font-semibold text-teal-900">
            About Us
          </Link>
          <Link to="/features" className="text-sm font-semibold text-teal-900">
            Features
          </Link>
          <Link to="/contact-us" className="text-sm font-semibold text-teal-900">
            Contact Us
          </Link>
        </PopoverGroup>

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
              <div className="space-y-2 py-6">
                <Disclosure as="div" className="-mx-3">
                  <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold text-teal-900 hover:bg-teal-50">
                    Courses
                    <ChevronDownIcon aria-hidden="true" className="h-5 w-5 group-data-[open]:rotate-180 text-teal-400" />
                  </DisclosureButton>
                  <DisclosurePanel className="mt-2 space-y-2">
                    {courses.map((item) => (
                      <DisclosureButton
                        key={item.name}
                        as="a"
                        href={item.href}
                        className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold text-teal-900 hover:bg-teal-50"
                      >
                        {item.name}
                      </DisclosureButton>
                    ))}
                  </DisclosurePanel>
                </Disclosure>
                <Link to="/about-us" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-teal-900 hover:bg-teal-50">
                  About Us
                </Link>
                <Link to="/features" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-teal-900 hover:bg-teal-50">
                  Features
                </Link>
                <Link to="/contact-us" className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-teal-900 hover:bg-teal-50">
                  Contact Us
                </Link>
              </div>
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
