import {Dialog, Transition} from '@headlessui/react';
import {Link} from '@shopify/hydrogen';
import clsx from 'clsx';
import {Fragment, useState} from 'react';
import {SanityMenuLink} from '../types';
import IconClose from './icons/IconClose';
import IconMenu from './icons/IconMenu';
import CountrySelector from './selects/SelectCountry.client';

type Props = {
  menuLinks: SanityMenuLink[];
};

export default function MobileNavigationDialog({menuLinks}: Props) {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  return (
    <>
      <button
        className={clsx(
          'relative left-0 -ml-4 flex items-center p-4 text-sm font-bold',
          'lg:hidden',
        )}
        onClick={handleOpen}
      >
        <IconMenu />
      </button>

      <Transition show={open}>
        <Dialog onClose={handleClose}>
          {/* Panel */}
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-[450ms]"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in-out duration-[400ms]"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed top-0 left-0 right-0 bottom-0 z-50 h-full w-full overflow-y-auto bg-white">
              {/* Header */}
              <header className="flex h-header-sm items-center justify-start px-4">
                <button
                  className="-ml-4 h-header-sm p-4"
                  type="button"
                  onClick={handleClose}
                >
                  <IconClose />
                </button>
              </header>

              {/* Links */}
              <div className="mt-6 space-y-4 px-4">
                <div className="text-2xl font-bold">
                  {menuLinks?.map((link) => {
                    if (link._type === 'collectionGroup') {
                      return (
                        <div className="rounded bg-indigo-500 p-2 text-white">
                          (Add collection groups)
                        </div>
                      );
                    }

                    if (link._type === 'linkExternal') {
                      return (
                        <div className="flex items-center" key={link._key}>
                          <a
                            className="linkTextNavigation relative whitespace-nowrap"
                            href={link.url}
                            onClick={handleClose}
                            rel="noreferrer"
                            target={link.newWindow ? '_blank' : '_self'}
                          >
                            {link.title}
                          </a>
                        </div>
                      );
                    }
                    if (link._type === 'linkInternal') {
                      if (!link.slug) {
                        return null;
                      }

                      return (
                        <div className="flex items-center" key={link._key}>
                          <Link
                            className="linkTextNavigation relative whitespace-nowrap"
                            onClick={handleClose}
                            to={link.slug}
                          >
                            {link.title}
                          </Link>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                <div className="-ml-2">
                  <CountrySelector align="left" />
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
