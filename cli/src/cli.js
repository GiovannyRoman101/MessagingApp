import vorpal from 'vorpal'
import { words } from 'lodash'
import { connect } from 'net'
import { Message } from './Message'

export const cli = vorpal()

let username
let server
let lastCommand = 'ok'

cli
  .delimiter(cli.chalk['yellow']('ftd~$'))

cli
  .mode('connect <username> [ipaddress]')   //  could remove exit
  .delimiter(cli.chalk['green']('connected>'))
  .init(function (args, callback) {
    username = args.username
    if (args.ipaddress !== undefined) {
      server = connect({ host: args.ipaddress, port: 8080 }, () => {
        server.write(new Message({ username, command: 'connect' }).toJSON() + '\n')
        callback()
      })
    } else {
      server = connect({ host: 'localhost', port: 8080 }, () => {
        server.write(new Message({ username, command: 'connect' }).toJSON() + '\n')
        callback()
      })
    }

    server.on('data', (buffer) => {
      let output = Message.fromJSON(buffer)
      if (output.command === 'disconnect') {
        this.log(cli.chalk['red'](output.toString()))
      } else if (output.command === 'connect') {
        this.log(cli.chalk['blue'](output.toString()))
      } else if (output.command === 'echo') {
        this.log(cli.chalk['cyan'](output.toString()))
      } else if (output.command === 'broadcast') {
        this.log(cli.chalk['magenta'](output.toString()))
      } else if (output.command === 'users') {
        this.log(cli.chalk['yellow'](output.toString()))
      } else {
        this.log((output.toString()))
      }
    })

    server.on('end', () => {
      cli.exec('exit')
    })
  })
  .action(function (input, callback) {
    const [ command, ...rest ] = words(input, /[^ ]+/g) // regex means input has a set not including space and it is global
    const contents = rest.join(' ')

    if (command === 'disconnect') {
      server.end((new Message({ username, command }).toJSON() + '\n'))
    } else if (command === 'echo') {
      lastCommand = command
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
    } else if (command === 'users') {
      lastCommand = command
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
    } else if (command === 'broadcast') {
      lastCommand = command
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
    } else if (command.includes('@')) {
      lastCommand = command
      server.write(new Message({ username, command, contents }).toJSON() + '\n')
    } else if (lastCommand === 'echo' || lastCommand === 'users' || lastCommand === 'broadcast' || lastCommand.includes('@')) {
      server.write(new Message({ username, command: lastCommand, contents: (command + contents) }).toJSON() + '\n')
    } else {
      this.log(`Command <${command}> was not recognized`)
    }
    callback()
  })
