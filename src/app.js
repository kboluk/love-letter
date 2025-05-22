const loginForm = document.querySelector('form#login')
let socket

const connect = () => {
  // Create WebSocket connection.
  socket = new WebSocket(`ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}`);

  // Connection opened
  socket.addEventListener("open", (event) => {
    console.log("Hello Server!");
  });

  // Listen for messages
  socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data);
  });

}

loginForm.addEventListener('submit', e => {
  e.preventDefault()
  const formData = new FormData(loginForm)
  const name = formData.get('name')
  fetch('/login', { method: 'POST', body: JSON.stringify({ name }), headers: { 'content-type': 'application/json' } })
    .then(i => i.json())
    .then(connect)
})