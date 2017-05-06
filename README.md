iitg-webmail-notify
=========
[![npm version](https://badge.fury.io/js/iitg-webmail-notify.svg)](https://badge.fury.io/js/iitg-webmail-notify)

A module for getting event based notifications containing new webmail for IITG webmail servers.

## Installation

  ```
  $ npm install iitg-webmail-notify
  ```
## Usage
 
  ### Example

  ```javascript
  var Webmail = require('iitg-webmail-notify');
  ....
  
  // Store user details in an object
  var userDetails = {
    username : username, // Without @iitg.ernet.in
    password : password,
    mailServer: mailServer // Among 'teesta', 'disang', 'naambor', 'tamdil', 'dikrong'
    path: '', // specify relative folder where to save attachments
              // defaults to folder where this is called from
    debug: true // for extra output, defaults to false 
  };
  
  // Create new Webmail object
  webmail = new Webmail(user);

  // Pass a callback which will be called
  // when a new mail is recevied in user's
  // inbox. mail is an object as described below.
  webmail.on('mail', function(mail) {
    console.log(mail)
    // Can user socket emitter event here
    // For example:
    // socket.emit('webmail', mail);
  })

  // Catch error event.
  webmail.on('error', function(error) {
    console.log(error)
  })
  ...
  ```
### Data types

* _mail_ is an object representing the newly received webmail, and has the following properties:
    * **from** - _object_ - The sender of the mail. Contains two entries.  
      * **email** - _string_ - The email of the sender
      * **name** - _string_ - The name of the sender
    * **to** - _array_ - The receivers of the mail. Each entry is an object with email and name, as described above.
    * **date** - _date_ - The internal server date for the mail.
    * **subject** - _string_ - The subject of the mail.
    * **text** - _string_ - Plain text body of the mail.
    * **textAsHtml** - _string_ - The plaintext body of the message formatted as HTML.
    * **attachments** - _array_ - Array of objects containing name and path of each attachment.
    
## TODO

- [x] Attachments
- [ ] Filtering 
- [ ] Tests 

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.
