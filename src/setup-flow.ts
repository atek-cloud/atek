import cfonts from 'cfonts'
import chalk from 'chalk'
import boxen from 'boxen'
import figures from 'figures'
import inquirer from 'inquirer'
import terminalLink from 'terminal-link'
import { users } from '@atek-cloud/adb-tables'
import { hashPassword } from './lib/crypto.js'
import * as serverdb from './serverdb/index.js'

export async function run () {
  const userRecords = (await users(serverdb.get()).list()).records
  if (userRecords.length > 0) return

  cfonts.say('WELCOME TO ATEK', {gradient: 'red,blue'})

  console.log(chalk.yellow(boxen(`${figures.warning} ${chalk.bold('Warning: This is an unstable preview build')}. You may have to delete your Atek data due to breaking changes during this phase.`, {padding: 1, margin: 1, borderStyle: 'double'})))
  const {understood} = await inquirer.prompt([{type: 'confirm', name: 'understood', message: 'Do you understand?', default: true}])
  if (!understood) {
    console.log('Okay well... We\'re going to continue with setup but you\'ve been warned.')
  }
  
  console.log('')
  console.log('Let\'s create your first user')
  const {username} = await inquirer.prompt([
    {type: 'input', name: 'username', message: 'Username', validate: (input) => {
      if (input.length < 3) return 'Must be 3 or more characters long.'
      if (/[a-z][a-z0-9]*/i.test(input) === false) return 'Please stick to characters and numbers and start with a character'
      return true
    }}
  ])
  let password
  do {
    const {pass1} = await inquirer.prompt([
      {type: 'password', name: 'pass1', message: 'Password', mask: '*', validate: (input) => {
        if (input.length < 3) return 'Must be 3 or more characters long.'
        return true
      }}
    ])
    const {pass2} = await inquirer.prompt([
      {type: 'password', name: 'pass2', message: 'Confirm password', mask: '*'}
    ])
    if (pass1 === pass2) {
      password = pass1
      break
    }
    console.log('Those passwords didn\'t match. Mind trying again?')
  } while (true)

  await users(serverdb.get()).create({
    username,
    hashedPassword: await hashPassword(password),
    role: 'admin'
  })
  console.log(chalk.green(figures.tick), 'User', username, 'created as an admin')
  console.log('You\'re good to go!')
  console.log('')
  console.log(`  Open ${terminalLink('http://localhost/', 'http://localhost')} to log into Atek.`)
  console.log('')
}