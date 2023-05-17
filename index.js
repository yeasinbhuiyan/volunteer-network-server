const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



const express = require('express');
var jwt = require('jsonwebtoken');
const app = express()
const cors = require('cors');
require('dotenv').config()

const port = process.env.PORT || 5000





// middlewear
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9xgdj4e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJwt = (req, res, next) => {

  const authorize = req.headers?.authorize

  console.log(authorize)
  if (!authorize) {
    return res.status(401).send({ error: 1, message: 'User Unauthorize' })

  }

  const token = authorize.split(' ')[1]

  console.log(token)

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {

    if (err) {
      return res.status(401).send({ error: 1, message: 'User Unauthorize' })
    }

    req.decoded = decoded

    next()


  });


}





async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("volunteer-network");
    const volunteerCollection = database.collection("volunteers");
    const userCollection = database.collection("usersBookings");

    app.get('/volunteers/:text', async (req, res) => {




      const searchText = req.params.text
      console.log('paka', searchText)

      if (searchText == '1') {
        const result = await volunteerCollection.find().toArray()
        console.log('2', result);
        res.send(result)
      }
      else {

        const query = { title: searchText }
        const result = await volunteerCollection.find(query).toArray()

        console.log('1', result);
        res.send(result)
      }



    })



    app.post('/bookings', async (req, res) => {
      const body = req.body
      const result = await userCollection.insertOne(body)
      res.send(result)


    })


    app.post('/upload', async (req, res) => {
      const body = req.body
      const result = await volunteerCollection.insertOne(body)
      res.send(result)

    })

    app.get('/bookings', verifyJwt, async (req, res) => {
      console.log(req.decoded.email)

      if (!req.decoded?.email) {
        return res.status(401).send('User Unauthorize')
      }


      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }

      }
      if (query) {
        const result = await userCollection.find(query).toArray()
        res.send(result)
      }
      else {
        const result = await userCollection.find().toArray()
        res.send(result)
      }


    })


    app.delete('/cancel/:id', async (req, res) => {
      const id = req.params.id

      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query)
      res.send(result)

    })



    // jwt token 

    app.post('/jwt', (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });

      res.send({ token })


    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('volundeer network server is running')

})

app.listen(port, () => {
  console.log(`This server running on ${port} port`)
})