require('dotenv').config()
const mongoose = require('mongoose')

const url = process.env.MONGODB_URI_PHONEBOOK_APP

console.log('connecting to', url)

mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Person = mongoose.model('Person', personSchema)

if (process.argv.length === 3) {
  Person.find({}).then(result => {
    console.log('persons:')
    result.forEach(p => console.log(p.name, p.number))
    mongoose.connection.close()
  })
}

if (process.argv.length === 5) {
  const newPerson = new Person({
    name: process.argv[3],
    number: process.argv[4],
  })

  newPerson.save().then(result => {
    console.log('person saved')
    mongoose.connection.close()
  })
}
