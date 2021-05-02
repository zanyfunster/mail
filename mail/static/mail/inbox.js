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
  
  // load emails for selected mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // iterate through emails 
    emails.forEach(element => {

      // create new div in inbox.html #emails-view with email id, sender, subject, and timestamp
      let email_row = document.createElement('div');

      // set row id to email#id, which is used by view_email function
      email_row.id = `email${element.id}`;

      // set row icons
      let row_icons = '';
      // set class to row, and if read, add class read
      if (element.read === true) {
        email_row.className = 'row list-row read';
        row_icons = '<i class="far fa-envelope-open"></i>';
      } else {
        email_row.className = 'row list-row new';
        row_icons = '<i class="far fa-envelope"></i>';
      }

      // inside row div, add col div with sender, subject, timestamp
      email_row.innerHTML = `<div class="col-1 row-icons">${row_icons}</div>
      <div class="col-4" id="sender${element.id}">${element.sender}</div>
      <div class="col-4" id="subject${element.id}">${element.subject}</div>
      <div class="col-3 ts" id="senton${element.id}">${element.timestamp}</div>`;
      
      // add event listener to view email
      email_row.addEventListener('click', function () {

        // TRY MOVING THIS TO view_email TOMORROW!
        // check if email row is already open
        if (email_row.classList.contains('open')) {
          console.log('this email is already open!');
        } else {
          view_email(element.id);
        }
        
      });

      // add email_row to emails-view div
      document.querySelector('#emails-view').append(email_row);

    });
  });
}

// displays a message in #message div using bootstrap alert type
function display_message(type, message) {
  document.querySelector('#messages').innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

function view_email(id) {

  // select requested email id
  let view_email_row = document.querySelector(`#email${id}`);

  

  // add 'open' to classes
  view_email_row.classList.add('open');
  
  // switch icon to close icon
  let icon_col = view_email_row.querySelector('.row-icons');
  icon_col.innerHTML = '';
  let close_icon = document.createElement('i');
  close_icon.className = 'far fa-window-close';

  // add event listener to icon to close email
  close_icon.addEventListener('click', function() {
    console.log('closing event listener clicked!');
    close_email(view_email_row);
  });
  icon_col.append(close_icon);

  // GET request to load contents of email object
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      // plug in sender, subject, recipients, timestamp, body with view styling
      document.querySelector(`#sender${id}`).innerHTML = `<span class="show-on-view">From: </span>${email.sender}`;
      document.querySelector(`#subject${id}`).innerHTML = `<span class="show-on-view">Subject: </span>${email.subject}`;
      document.querySelector('#view-recipients').innerHTML = `To: ${email.recipients}`;
      document.querySelector(`#senton${id}`).innerHTML = `<span class="show-on-view">Sent on </span>${email.timestamp}`;
      document.querySelector('#view-body').innerHTML = email.body;

      // move open email div to current row of emails list and change display to show
      let email_contents = document.querySelector('#open-email');
      view_email_row.insertAdjacentElement('beforeend', email_contents);
      email_contents.style.display = 'block';

      console.log('the now open email has class ', view_email_row.getAttribute('class'));

  });
  
}

function close_email(email_row) {
  
  document.querySelector('#open-email').style.display = 'none';
  let read_icon = email_row.querySelector('.row-icons');
  read_icon.innerHTML = '<i class="far fa-envelope-open"></i>';
  email_row.querySelector('.show-on-view').remove();

  let email_id = email_row.id;
  email_id = email_id.substring(5);
  console.log('closing email', email_id);

  // mark email as read with PUT request
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  email_row.classList.remove('open');

}