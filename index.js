const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app =express();
const port = process.env.PORT || 5000 ;

// middleware 

app.use(cors());
app.use(express.json())


// career-compass
// tpXK3k01EiowvdAh


console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)

const uri = "mongodb+srv://career-compass:tpXK3k01EiowvdAh@cluster0.osztyuf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

     const allJobCollection = client.db('JobsDB').collection('job');
     const appliedJobsCollection = client.db('appliedDB').collection('applied')

    //  add jobs
    app.get('/jobs' , async(req, res) =>{
        const cursor = allJobCollection.find();
        const result = await cursor.toArray();
        res.send(result)
    })

    app.post('/jobs' , async(req ,res)=>{
        const job = req.body;
        const result = await allJobCollection.insertOne(job);
        res.send(result)
    });

    // find job by id
    app.get('/jobs/:id', async(req , res) =>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const job = await allJobCollection.findOne(query);
        res.send(job)
    })

    // applied jobs 
     app.get('/appliedJobs', async(req , res )=>{
       const cursor = appliedJobsCollection.find();
       const result =await cursor.toArray();
       res.send(result)
     })

     app.post('/appliedJobs', async (req ,res) =>{
        const appliedJob = req.body;
        const result = await appliedJobsCollection.insertOne(appliedJob);
        res.send(result)
     }) 
 
     app.get('/appliedJobs/:email', async(req, res)=>{
      // console.log(req.params.email)
      const result = await appliedJobsCollection.find({
        email: req.params.email}).toArray();
      res.send(result)
    })

    // 

    app.get('/myJobs/:email', async(req ,res)=>{

      const result = await allJobCollection.find({email: req.params.email}).toArray();
      res.send(result)
    })
    // delete 

    app.delete('/myJobs/:id', async(req , res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result =await allJobCollection.deleteOne(query);
      res.send(result);

    })

    
    // Update
    app.put('/updateJob/:id',async (req, res)=>{
      const id =req.params.id;
      const filter= {_id: new ObjectId(id)};
      const options ={upsert: true};
      const updateJob = req.body
      const update ={
        $set:{
          job_title:updateJob.job_title,
          country_name:updateJob.country_name,
          job_category:updateJob.job_category,
          banner:updateJob.banner,
          deadline:updateJob.deadline,
          salary_range:updateJob.salary_range, 
          number:updateJob.number,
          total_visitors_per_year:updateJob.total_visitors_per_year,
          email:updateJob.email,
          name:updateJob.name,
          job_description:updateJob.job_description

        }
      }
      const result =await allJobCollection.updateOne(filter,update,options);
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req ,res) =>{
    res.send('server is running')
})

app.listen(port ,()=>{
    console.log( `server is running on the port ${port}`)
})