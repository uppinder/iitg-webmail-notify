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
		
		this._user = {
			user: config.username,
			password: config.password,
			host: config.mailServer.toLowerCase() + '.iitg.ernet.in',
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
			console.log('ready')
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

			const f = this.imap.seq.fetch(this._inbox.messages.total + ':*', { bodies: '' })
	        
	        f.on('message', (msg) => {
	          msg.on('body', (stream, info) => {
	            mailParser(stream, (err, mail) => {
	              if(err) {
		        	this.emitError(err)
	                return
	              }
	              this.emitMessage(mail)
	            })
	          })
	        })

	        f.once('error', function(err) {
	        	this.emitError(err)
	        })
		})

		this.imap.once('error', (err) => {
			if(err) {
				this.emitError(err)
				return
			}
		})

		this.imap.connect()
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
	 * Helper member that extracts useful entities
	 * from received mail object form web server, and
	 * emits it to the client.		
	 *
	 * @param      {object}  mail    The mail
	 */
	emitMessage(mail) {
		const webmail = {
			from: {
				email: mail.from.value[0].address,
				name: mail.from.value[0].name
			},
			to: mail.to.value,
			date: mail.date,
			subject: mail.subject,
			text: mail.text,
			textAsHtml: mail.textAsHtml
		}

		this.emit('mail', webmail)
	}
} 

/**
 * Module exports.
 * @public
 */

module.exports = Webmail