import React from 'react';

function Modal({onClose}) {
    return (
        <div className='fixed inset-0 bg-grey bg-opacity-30 backdrop-blur-sm flex justify-center items-center'>
            <div className='bg-green-100 border-2 border-black rounded-xl px-20 py-16 flex flex-col gap-4 items-center mx-4'>
                <h2 className='text-3xl font-extrabold text-black-800'>Success</h2>
                <p className='text-xl font-medium text-black-60 max-w-md text-center'>Your job has been posted successfully! You will receive quotes from local tradespeople shortly.</p>
                <button className='mt-4 bg-blue-600 hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 text-white font-bold py-4 px-6 rounded-md justify-center items-center text-center' onClick={onClose}>
                    Close
                </button>
            </div>
            </div>
        )
    }
    export default Modal;