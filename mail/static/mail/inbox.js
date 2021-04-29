document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // by default load inbox
  load_mailbox('inbox');

  // in compose view, submit button sends email 
  document.querySelector('#compose-form').onsubmit = () => {

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
  
    // use fetch to send compose email form contents via post to emails route
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    
    .then(response => response.json())
    .then(result => {

        console.log(result);

        // if message sends, result object will contain message
        if (result.message) {
          // view sent messages and display success alert message
          load_mailbox('sent');
          display_message('success', result.message);
      
          // return false to prevent additional get request
          return false;

        // if error, keep displaying form with error message 
        } else {
          display_message('danger', result.error);
          return false;
        };

    })

    .catch(error => {
        console.log('Error', error);
        // catch will print that there was an error with fetch
    });
    
    return false;
  }

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#messages').innerHTML = '';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#messages').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

}

// displays a message in #message div using bootstrap alert type
function display_message(type, message) {
  document.querySelector('#messages').innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}