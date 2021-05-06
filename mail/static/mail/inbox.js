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
          display_message('warning', result.message);
      
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
  document.querySelector('#messages').style.visibility = 'visible';
  document.querySelector('#messages').innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  setTimeout(function() { 
    document.querySelector('#messages').style.visibility = 'hidden';
  }, 3000);
}

// this little function changes the background of the selected menu button to show which mailbox is being viewed
function selected_menu_button(selected_btn) {

  // get all menu buttons
  let all_menu_btns = document.querySelectorAll('#chi-menu button');
  
  // iterate through menu buttons
  all_menu_btns.forEach(menu_btn => {

    // if archived selected, change selected_btn name to account for different btn id
    if (selected_btn == 'archive') {
      selected_btn = 'archived';
    }

    // if selected, set btn background color to light gold, otherwise white
    if (menu_btn.id == selected_btn) {
      menu_btn.style.backgroundColor = '#fff584';
    } else {
      menu_btn.style.backgroundColor = 'white';
    }
  });
}

// show new chi-mail compose view
function compose_email() {

  // change bg color of selected menu button
  selected_menu_button('compose');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#messages').innerHTML = '';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

// load selected mailbox
function load_mailbox(mailbox) {

  // change bg color of selected menu button  
  selected_menu_button(mailbox);

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
      email_mailbox_row.className = 'row email-mailbox-row';
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
        email_mailbox_row.innerHTML = `<div class="col-1" id="status-icon">${icon}</div>
        <div class="col-4 ellipsis-line">${element.recipients}</div>
        <div class="col-4 ellipsis-line">${element.subject}</div>
        <div class="col-3">${element.timestamp}</div>`;
      } else {
        email_mailbox_row.innerHTML = `<div class="col-1" id="status-icon">${icon}</div>
        <div class="col-4 ellipsis-line">${element.sender}</div>
        <div class="col-4 ellipsis-line">${element.subject}</div>
        <div class="col-3">${element.timestamp}</div>`;
      }

      // add event listener to view email
      email_mailbox_row.addEventListener('click', function (e) {

        // view email function
        view_email(element.id);

        // scroll to selected email parent element so scrolls to vertical center of window
        email_mailbox_row.parentElement.scrollIntoView({behavior: "smooth", block: "center"});

        // add border and shadow to highlight open email
        email_mailbox_row.parentElement.style.boxShadow = '1px 1px 3px #616161';
        email_mailbox_row.parentElement.style.border = '1px solid #ffae00'

      });

      // add email_row to #emails-view>#id container
      email_box.append(email_mailbox_row);

      // create another hidden row div to contain email contents
      let email_contents_row = document.createElement('div');
      email_contents_row.id = `email-contents-row${element.id}`;
      email_contents_row.style.display = 'none';
      email_contents_row.className = 'row email-contents-row';
      email_box.append(email_contents_row);
      
    });
  });
}

// opens selected email for viewing by toggling display on mailbox and contents rows
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

  // if email row is not empty (email has not yet been viewed during this session), add contents of requested email
  if (!email_contents_row.querySelector('div')) {

  // inside row, create divs for requested email col and nested header rows and body text row
  let email_contents_col = document.createElement('div');
  email_contents_col.className = 'col-12';
  email_contents_row.append(email_contents_col);
  let email_header_row1 = document.createElement('div');
  email_header_row1.className = 'row email-headers';
  let email_header_row2 = document.createElement('div');
  email_header_row2.className = 'row email-headers';
  let email_body = document.createElement('div');
  email_body.className = 'row';

  // get requested email contents using get request
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // add a close icon in place of read/unread icon
    let close_icon = document.createElement('div');
    close_icon.className = 'col-1 close-icon';
    close_icon.innerHTML = '<i class="far fa-window-close"></i>';

    // add event listener on close icon to close email
    close_icon.addEventListener('click', function () {
      close_email(id);
    });
    email_header_row1.append(close_icon);

    // add lots of divs to hold header guts for requested email
    let sender_div = document.createElement('div');
    sender_div.className = 'col-4 ellipsis-line';
    sender_div.id = `sender${email.id}`;
    sender_div.innerHTML = `From: ${email.sender}`;
    email_header_row1.append(sender_div);

    let recipients_div = document.createElement('div');
    recipients_div.className = 'col-4 ellipsis-line';
    recipients_div.id = `recipients${email.id}`;
    recipients_div.innerHTML = `To: ${email.recipients}`;
    email_header_row1.append(recipients_div);

    // add div for reply/archive buttons into first header row
    let email_buttons = document.createElement('div');
    email_buttons.className = 'col-3';
    email_buttons.id = 'email-buttons';
    email_header_row1.append(email_buttons);

    let spacer_div = document.createElement('div');
    spacer_div.className = 'col-1';
    email_header_row2.append(spacer_div);

    let subject_div = document.createElement('div');
    subject_div.className = 'col-8 ellipsis-line';
    subject_div.id = `subject${email.id}`;
    subject_div.innerHTML = `Subject: ${email.subject}`;
    email_header_row2.append(subject_div);

    let timestamp_div = document.createElement('div');
    timestamp_div.className = 'col-3 timestamp';
    timestamp_div.id = `sent${email.id}`;
    timestamp_div.innerHTML = `${email.timestamp}`;
    email_header_row2.append(timestamp_div);
    
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

      // if viewing archive, name of button is unarchive; else archive
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
            display_message('warning', `Unarchived message from ${sender} re: ${subject}`);
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
            display_message('warning', `Archived message from ${sender} re: ${subject}`);
          }
        }
      });
    }

    // add body text into div as innerText to retain message formatting
    const body_text = email.body;
    let body_col = document.createElement('div');
    body_col.className = 'col-12 email-body';
    body_col.innerText = body_text;

    // add these email content divs to appropriate parent divs
    email_body.append(body_col);
    email_contents_col.append(email_header_row1);
    email_contents_col.append(email_header_row2);
    email_contents_col.append(email_body);
  
  });

  }
  // show email contents and hide mailbox row for selected email
  email_contents_row.style.display = "flex";
  email_contents_row.previousSibling.style.display = "none";

  // mark email as read with PUT request
  // use await/async so request will finish and read status will take effect when inbox next displays
  async function mark_as_read() { 
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

  // change border and box shadow back to default
  closing_email_contents.parentElement.style.boxShadow = 'none';
  closing_email_contents.parentElement.style.border = '1px solid #b0afa2';

  // use previousSibling to show mailbox row
  let show_mailbox_row = closing_email_contents.previousSibling;
  show_mailbox_row.style.display = "flex";

  // change styling and icon to show message read
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