'use client';

import { Fragment, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Menu, RadioGroup, Transition } from '@headlessui/react';
import { Monitor, MoonStar, Sun } from 'lucide-react';

const Blank = () => <svg className="h-6 w-6" />;

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-1 flex items-center">
      <Menu as="div" className="relative inline-block text-left">
        <div className="flex h-8 w-8 items-center justify-center rounded p-1 hover:bg-gray-200 dark:hover:bg-primary-600">
          <Menu.Button aria-label="Theme switcher">
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <MoonStar strokeWidth={1.5} size={22} />
              ) : (
                <Sun strokeWidth={1.5} size={22} />
              )
            ) : (
              <Blank />
            )}
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-50 mt-2 w-32 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
            <RadioGroup value={theme} onChange={setTheme}>
              <div className="p-1">
                <RadioGroup.Option value="light">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-primary-600 text-white' : ''
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <div className="mr-2">
                          <Sun />
                        </div>
                        Light
                      </button>
                    )}
                  </Menu.Item>
                </RadioGroup.Option>
                <RadioGroup.Option value="dark">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-primary-600 text-white' : ''
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <div className="mr-2">
                          <MoonStar strokeWidth={1.5} size={22} />
                        </div>
                        Dark
                      </button>
                    )}
                  </Menu.Item>
                </RadioGroup.Option>
                <RadioGroup.Option value="system">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-primary-600 text-white' : ''
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <div className="mr-2">
                          <Monitor />
                        </div>
                        System
                      </button>
                    )}
                  </Menu.Item>
                </RadioGroup.Option>
              </div>
            </RadioGroup>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default ThemeSwitch;
