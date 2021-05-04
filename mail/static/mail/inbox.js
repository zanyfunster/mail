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

  // select requested email_contents_row
  let email_contents_row = document.querySelector(`#email-contents-row${id}`);

  // inside row, create divs for requested email col and nested header rows and body text row
  let email_contents_col = document.createElement('div');
  email_contents_col.className = 'col-12';
  email_contents_row.append(email_contents_col);
  let email_header_row1 = document.createElement('div');
  email_header_row1.className = 'row';
  let email_header_row2 = document.createElement('div');
  email_header_row2.className = 'row';
  let email_body = document.createElement('div');
  email_body.className = 'row';

  // get requested email contents using get request
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    let close_icon = document.createElement('div');
    close_icon.className = 'col-1';
    close_icon.innerHTML = '<i class="far fa-window-close"></i>';

    // add event listener on close icon to close email
    close_icon.addEventListener('click', function () {
      close_email(id);
    });
    email_header_row1.append(close_icon);

    // add remaining header guts for requested email
    let sender_div = document.createElement('div');
    sender_div.className = 'col-4';
    sender_div.id = `sender${email.id}`;
    sender_div.innerHTML = `From: ${email.sender}`;
    email_header_row1.append(sender_div);

    let subject_div = document.createElement('div');
    subject_div.className = 'col-4';
    subject_div.id = `subject${email.id}`;
    subject_div.innerHTML = `Subject: ${email.subject}`;
    email_header_row1.append(subject_div);

    let timestamp_div = document.createElement('div');
    timestamp_div.className = 'col-3';
    timestamp_div.id = `sent${email.id}`;
    timestamp_div.innerHTML = `Sent on ${email.timestamp}`;
    email_header_row1.append(timestamp_div);

    // add spacer and recipients divs to header row 2 
    let spacer_div = document.createElement('div');
    spacer_div.className = 'col-1';
    email_header_row2.append(spacer_div);

    let recipients_div = document.createElement('div');
    recipients_div.className = 'col-8';
    recipients_div.id = `recipients${email.id}`;
    recipients_div.innerHTML = `To: ${email.recipients}`;
    email_header_row2.append(recipients_div);

    // add div for reply/archive buttons into header row 2
    let email_buttons = document.createElement('div');
    email_buttons.className = 'col-3';
    email_buttons.id = 'email-buttons';
    email_header_row2.append(email_buttons);
    
    // show buttons for reply and archive, if there aren't already buttons
    if (!email_buttons.querySelector('button')) {

      // create reply button and add to buttons div
      let reply_btn = document.createElement('button');
      reply_btn.type = 'button';
      reply_btn.className = 'btn btn-light btn-sm';
      reply_btn.innerHTML = '<i class="fas fa-reply"></i> Reply';
      email_buttons.append(reply_btn);

      // set event listener to run reply function when reply button clicked
      reply_btn.addEventListener('click', function () {
        reply(id);
      });

      // create archive/unarchive button and add to buttons div
      let archive_btn = document.createElement('button');
      archive_btn.type = 'button';
      archive_btn.className = 'btn btn-light btn-sm';

      // check if viewing archive mailbox
      let mailbox_name = document.querySelector('#emails-view > h3').innerHTML;

      // if archive, name of button is unarchive; else archive
      if (mailbox_name === 'Archive') {
        archive_btn.innerHTML = '<i class="fas fa-inbox"></i> Unarchive';
      } else {
        archive_btn.innerHTML = '<i class="fas fa-archive"></i> Archive';
      }

      // add archive button to buttons div in open email
      email_buttons.append(archive_btn);

      // run archive function with archive/unarchive button clicked
      archive_btn.addEventListener('click', async function () {

        // get message info for archive success display
        let sender = email_contents_row.querySelector(`#sender${id}`).innerHTML.slice(5);
        let subject = email_contents_row.querySelector(`#subject${id}`).innerHTML.slice(8);

        if (mailbox_name === 'Archive') {
          // if archive mailbox open and button clicked, set archived to false
          // use async function and await fetch to send put request with archive status
          // by doing so, function won't proceed until promise received
          let response = await fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
          // after promise, load inbox so it will show unarchived message
          if (response) {
            load_mailbox('inbox');
            display_message('info', `Unarchived message from ${sender} re: ${subject}`);
          }

        } else {

          // if archive button is clicked, use fetch request to set archived to true
          let response = await fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          // after promise, then load mailbox so archived message won't still show up
          if (response) {
            load_mailbox('inbox');
            display_message('info', `Archived message from ${sender} re: ${subject}`);
          }

        }
        
      });
    }

    // add body text into div as innerText to retain message formatting
    const body_text = email.body;
    let body_col = document.createElement('div');
    body_col.className = 'col-12 email-body';
    body_col.innerText = body_text;
    email_body.append(body_col);
    email_contents_col.append(email_header_row1);
    email_contents_col.append(email_header_row2);
    email_contents_col.append(email_body);
  
  });

  // show email contents and hide mailbox row for selected email
  email_contents_row.style.display = "flex";
  email_contents_row.previousSibling.style.display = "none";

  async function mark_as_read() { 
    // mark email as read with PUT request
    // use await/async so request will finish and read status will take effect before displaying message
    let read_response = await fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
  }
  mark_as_read();

}

// close email - called by click on close icon in open email
function close_email(id) {
  // get email contents row using email id
  let closing_email_contents = document.querySelector(`#email-contents-row${id}`);
  // hide email contents row
  closing_email_contents.style.display = "none";
  // use previousSibling to show mailbox row
  let show_mailbox_row = closing_email_contents.previousSibling;
  show_mailbox_row.style.display = "flex";
  show_mailbox_row.parentElement.className = 'col-12 email-box read';
  let last_icon = closing_email_contents.previousSibling.querySelector('#status-icon');
  last_icon.innerHTML = '<i class="far fa-envelope-open"></i>';

  // clear local storage of viewing: email id
  localStorage.clear();
}

function reply(id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#messages').innerHTML = '';

  // use fetch to get email contents
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
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    
    // include text from original email in body with formatting
    const response_body = `
    
    ----- 
    On ${email.timestamp}, ${email.sender} wrote:

    ${email.body}`;
    document.querySelector('#compose-body').value = response_body;

  });

}