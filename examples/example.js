var Webmail = require('../index')

var user = {
  username: '', // with @iitg.ernet.in
  password: '',
  mailServer: '', // Among 'disang', 'teesta', 'naambor', 'tambdil',
  path: '', // specify relative folder where to save attachments
  debug: true // for extra output, defaults to false
};

webmail = new Webmail(user);

webmail.on('mail', function(mail) {
  console.log(mail)
  // Can socket emitter event here
  // For example:
  // socket.emit('webmail', mail);
})

webmail.on('error', function(error) {
  console.log(error)
})

