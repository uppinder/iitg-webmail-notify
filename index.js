/*
 * iitg-webmail-notify
 * Copyright(c) 2017 Uppinder Chugh
 * MIT Licensed
 */
'use strict'

/**
 * Module dependencies.
 * @private
 */

const Imap = require('imap')
const mailParser = require('mailparser').simpleParser
const EventEmitter = require('events')
const Async = require('async')
const path = require('path')
const fs = require('fs')
const colors = require('colors')
const datetime = require('node-datetime');

/**
 * Class for webmail. Create webmail
 * instance which will be used to listen
 * for new webmail event.
 *
 * @class      Webmail (name)
 */
class Webmail extends EventEmitter {
	/**
	 * Constructs the webmail object.
	 *
	 * @param      {object}  config  Contains user information
	 */
	constructor(config) {
		super()

		this._inbox = null
		this._first = true
		this.debug = config.debug || false
		this.attachPath = path.resolve(config.path || './')

		this._user = {
			user: config.username,
			password: config.password,
			host: getServerIp(config.mailServer),
			port: 993,
			tls: true
		}

		this.notify()
	}

	/**
	 * Main member that creates an imap object
	 * and runs IDLE after connecting to webmail server.
	 * Emits a 'mail' event upon receving new mail.
	 */
	notify() {
    	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    	
    	this.imap = new Imap(this._user)

		this.imap.once('ready', () => {
			if(this.debug) 
				debug('User ' + this._user.user.blue + ' successfully logged in.')
			
			this.emitLoginStatus(true)

			this.imap.openBox('INBOX', true, (err, box) => {
				if(err) {
					this.emitError(err)
					return
				}
				this._inbox = box
			})
		})

		this.imap.on('mail', (numNewMsgs) => {
			if(this._first) {
				this._first = false
				return
			}
			
			if(this.debug) 
				debug('New mail for: ' + this._user.user.blue)
		
			const f = this.imap.seq.fetch(this._inbox.messages.total + ':*', { bodies: '' })
	        
	        f.on('message', (msg) => {
	          msg.on('body', (stream, info) => {
	            mailParser(stream, (err, mail) => {
	              if(err) {
		        	this.emitError(err)
	                return
	              }
	              this.processMail(mail)
	            })
	          })
	        })

	        f.once('error', function(err) {
	        	this.emitError(err)
	        })
		})

		this.imap.once('error', (err) => {
			if(err) {
				this.emitLoginStatus(false)
				return
			}
		})

		this.imap.connect()
	}

	/**
	 * Helper member for processing received
	 * message. Used mainly for saving the
	 * attachments and extracting useful entities.
	 *
	 * @param      {object}  mail    The mail object
	 */
	processMail(mail) {
		// Process attachments
		const webmail = {
			from: {
				email: mail.from.value[0].address,
				name: mail.from.value[0].name
			},
			to: mail.to.value,
			date: mail.date,
			subject: mail.subject,
			text: mail.text,
			textAsHtml: mail.textAsHtml,
			attachments: []
		}

		if(mail.attachments.length > 0) {
			if(this.debug)
				debug('Attachments include:')
			
			webmail.attachments = mail.attachments.map((file) => {
				return {
					name: file.filename,
					path: path.join(this.attachPath, file.filename)
				}
			})
			
			this.emitMessage(webmail)	

			Async.map(mail.attachments, (file, callback) => {
				const filepath = path.join(this.attachPath, file.filename)
				const wstream = fs.createWriteStream(filepath)
			
				wstream.write(file.content)
				wstream.end(() => {
					if(this.debug)
						debug(filepath.blue)

					callback()
				})

			}, (err) => {
				if(err) {
					this.emitError(err)
					return
				}
			})

		} else {
			this.emitMessage(webmail)	
		}
	}

	/**
	 * Helper member for emitting error
	 * to client.
	 *
	 * @param      {object}  error   The specific error
	 */
	emitError(error) {
		this.emit('error', error)
	}

	/**
	 * Helper member for emitting the mail
	 * to the client.	
	 *
	 * @param      {object}  mail    The mail
	 */
	emitMessage(mail) {
		this.emit('mail', mail)
	}

	emitLoginStatus(status) {
		this.emit('login', {'success': status})
	}
} 

/**
 * Helper function for debugging
 *
 * @param      {string}  text    The text
 */
function debug(text) {
	const currTime = datetime.create().format('H:M:S')
	console.log(currTime.green + ' ' + text)
}

/**
 * Helper function for obtaining server
 * ip of webserver
 *
 * @param      {string}  server    The WebServer
 */
function getServerIp(server) {
	const serverList = {
		'teesta': '202.141.80.12',
		'naambor': '202.141.80.9',
		'disang': '202.141.80.10',
		'tamdil': '202.141.80.11',
		'dikrong': '202.141.80.13'
	}

	return serverList[server]
}

/**
 * Module exports.
 * @public
 */

module.exports = Webmail