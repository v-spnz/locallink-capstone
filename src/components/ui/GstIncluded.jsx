export default function GstIncluded({ block = false }) {
  return (
    <small
      className={`gst-included-note${block ? ' gst-included-note--block' : ''}`}
    >
      GST Included
    </small>
  )
}
