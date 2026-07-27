function Modal({ onClose, job, onConfirm, setSuccessMessage }) {
  return (
    <div className="fixed inset-0 bg-grey bg-opacity-30 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-green-100 border-2 border-black rounded-xl px-20 py-16 flex flex-col gap-4 items-center mx-4">
        <h2 className="text-3xl font-extrabold text-black-800">
          Confirm Job Posting
        </h2>
        <div className="text-xl font-medium text-black-60 max-w-md text-center">
          <strong>Job Title:</strong> {job.title}
        </div>
        <div>
          <strong>Description:</strong> {job.description}
        </div>
        <div>
          <strong>Category:</strong> {job.category}
        </div>
        <div>
          <strong>City:</strong> {job.city}
        </div>
        <div>
          <strong>Suburb:</strong> {job.suburb}
        </div>
        <button
          className="mt-4 bg-blue-600 hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 text-white font-bold py-4 px-6 rounded-md justify-center items-center text-center"
          onClick={() => {
            onConfirm()
            setSuccessMessage('Job has been successfully posted.')
          }}
        >
          Post
        </button>
        <button
          className="mt-4 bg-gray-300 hover:bg-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-gray-600 text-black font-bold py-4 px-6 rounded-md justify-center items-center text-center"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default Modal
