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

// displays a message in #message div using bootstrap alert type
function display_message(type, message) {
  document.querySelector('#messages').innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

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

  // clear localStorage so previously viewed email id won't screw everything up
  localStorage.clear();

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // create new >row>col divs in inbox.html #emails-view to be container box for email
  let emails_view_box = document.querySelector('#emails-view');
  let emails_view_row = document.createElement('div');
  emails_view_row.className = 'row';
  emails_view_box.append(emails_view_row);

  // load emails for selected mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // iterate through emails 
    emails.forEach(element => {

      let email_box = document.createElement('div');
      email_box.id = `email${element.id}`;
      
      // create a nested row div for mailbox view with read status icon, sender, subject, date 
      let email_mailbox_row = document.createElement('div');
      email_mailbox_row.id = `email-mailbox-row${element.id}`;
      email_mailbox_row.className = 'row';
      // set row icons
      let icon = '';
      // set class to row, and if read, add class read
      if (element.read === true) {
        icon = '<i class="far fa-envelope-open"></i>';
        email_box.className = 'col-12 email-box read';
      } else {
        icon = '<i class="far fa-envelope"></i>';
        email_box.className = 'col-12 email-box new';
      }
      emails_view_row.append(email_box);

      // inside row div, add col div with sender, subject, timestamp
      if (mailbox === 'sent') {
        email_mailbox_row.innerHTML = `<div class="col-1" id="status-icon"><i class="fas fa-paper-plane"></i></div>
        <div class="col-4">${element.recipients}</div>
        <div class="col-4">${element.subject}</div>
        <div class="col-3">${element.timestamp}</div>`;
      } else {
        email_mailbox_row.innerHTML = `<div class="col-1" id="status-icon">${icon}</div>
        <div class="col-4">${element.sender}</div>
        <div class="col-4">${element.subject}</div>
        <div class="col-3">${element.timestamp}</div>`;
      }

      // add event listener to view email
      email_mailbox_row.addEventListener('click', function () {
        view_email(element.id);
      });

      // add email_row to #emails-view>#id container
      email_box.append(email_mailbox_row);

      // create another hidden row div to contain email contents
      let email_contents_row = document.createElement('div');
      email_contents_row.id = `email-contents-row${element.id}`;
      email_contents_row.style.display = 'none';
      email_contents_row.className = 'row';
      email_box.append(email_contents_row);

      let email_contents_col = document.createElement('div');
      email_contents_col.className = 'col-12';
      email_contents_row.append(email_contents_col);

      let email_header_row1 = document.createElement('div');
      email_header_row1.className = 'row';
      let email_header_row2 = document.createElement('div');
      email_header_row2.className = 'row';
      let email_body = document.createElement('div');
      email_body.className = 'row';

      email_header_row1.innerHTML = `<div class="col-1" id="close-icon"><i class="far fa-window-close"></i></div>
      <div class="col-4" id="sender${element.id}">From: ${element.sender}</div>
      <div class="col-4" id="subject${element.id}">Subject: ${element.subject}</div>
      <div class="col-3" id="sent${element.id}">Sent on ${element.timestamp}</div>`;
      email_header_row2.innerHTML = `<div class="col-1"></div>
      <div class="col-8" id="recipients${element.id}">To: ${element.recipients}</div>
      <div class="col-3" id="email-buttons"></div>`;
      
      const body_text = element.body;
      let body_col = document.createElement('div');
      body_col.className = 'col-12 email-body';
      body_col.innerText = body_text;
      email_body.append(body_col);

      email_contents_col.append(email_header_row1);
      email_contents_col.append(email_header_row2);
      email_contents_col.append(email_body);
      
    });
  });
}

function view_email(id) {

  // if there is NOT (!) something in local storage called viewing
  if (!localStorage.getItem('viewing')) {
    // set viewing to requested email id so can check for already open email
    localStorage.setItem('viewing', id);
  } else {
    // if there is an email open already, hide contents and display mailbox
    let last_viewed = localStorage.getItem('viewing');
    close_email(last_viewed);
    // set viewing to requested email id
    localStorage.setItem('viewing', id);
  }

  // show email contents and hide mailbox row for selected email
  let email_contents_row = document.querySelector(`#email-contents-row${id}`);
  email_contents_row.style.display = "flex";
  email_contents_row.previousSibling.style.display = "none";

  // mark email as read with PUT request
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  // add event listener on close icon to close email
  let close_icon = email_contents_row.querySelector('#close-icon');
  close_icon.addEventListener('click', function () {
    close_email(id);
  });

  // show buttons for reply and archive, if there aren't already buttons
  let email_buttons = email_contents_row.querySelector('#email-buttons');
  if (!email_buttons.querySelector('button')) {

    let reply_btn = document.createElement('button');
    let archive_btn = document.createElement('button');
    reply_btn.type = 'button';
    reply_btn.className = 'btn btn-light btn-sm';
    reply_btn.innerHTML = '<i class="fas fa-reply"></i> reply';
    archive_btn.type = 'button';
    archive_btn.className = 'btn btn-light btn-sm';
    archive_btn.innerHTML = '<i class="fas fa-archive"></i> archive';
    email_buttons.append(reply_btn);
    email_buttons.append(archive_btn);

    reply_btn.addEventListener('click', function () {
      reply(id);
    });

    archive_btn.addEventListener('click', async function () {

      // use async function and await fetch to send put request with archive status
      // by doing so, function won't proceed until promise received
      const response = await fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
      })

      // get message info for success display
      let sender = email_contents_row.querySelector(`#sender${id}`).innerHTML.slice(5);
      let subject = email_contents_row.querySelector(`#subject${id}`).innerHTML.slice(8);
      // after promise, then load mailbox so archived message won't still show up
      if (response) {
        load_mailbox('inbox');
        display_message('info', `Archived message from ${sender} re: ${subject}`);
      }
      

    });
  }

}

function close_email(id) {
  let closing_email_contents = document.querySelector(`#email-contents-row${id}`);
  closing_email_contents.style.display = "none";
  let show_mailbox_row = closing_email_contents.previousSibling;
  show_mailbox_row.style.display = "flex";
  show_mailbox_row.parentElement.className = 'col-12 email-box read';
  let last_icon = closing_email_contents.previousSibling.querySelector('#status-icon');
  last_icon.innerHTML = '<i class="far fa-envelope-open"></i>';
  localStorage.clear();
}

function reply(id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#messages').innerHTML = '';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // prefill composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    let subject_start = subject.substring(0,3);
    if (subject_start === 'Re:') {
      document.querySelector('#compose-subject').value = email.subject;
    } else {
      console.log('subject does not contain re! in substring', subject_start);
    }
    

    const response_body = `
    
    ----- 
    On ${email.timestamp}, ${email.sender} wrote:

    ${email.body}`;

    document.querySelector('#compose-body').value = response_body;

  });

}

///// TO DO TOMORROW!
// create unarchive button on archive box
// add get request for individual email in view email, and move filling in email contents to view email function
// fix shitty styling issues with flexbox rows/email body