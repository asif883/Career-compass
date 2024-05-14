const express = require('express');
const cors = require('cors');
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt =require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app =express();
const port = process.env.PORT || 5000 ;

// middleware 

app.use(
  cors({
  origin: [
        'http://localhost:5173',
        'https://career-compass-d0501.web.app',
        'https://career-compass-d0501.firebaseapp.com'
   ],
  credentials: true,
  }),
  )
app.use(express.json())

app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.osztyuf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req , res , next) => {
  console.log('log: info', req.method , req.url);
  next();
}

const verifyToken =(req, res, next)=>{
  const token = req.cookies?.token;
  // console.log('token in the middleware', token);
  if(!token){
    return res.send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN,(err, decoded) =>{
    if(err){
      return res.status(401).send({message :'unauthorized access'})
    }
    req.user = decoded;
     next();
  })
  
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

     const allJobCollection = client.db('JobsDB').collection('job');
     const appliedJobsCollection = client.db('appliedDB').collection('applied')

    // auth related
    app.post('/jwt', async(req ,res )=>{
      const user = req.body;
      // console.log(user)
      
      const token = jwt.sign(user , process.env.ACCESS_TOKEN, {expiresIn: '1h'})
      res.cookie('token' , token,cookieOptions)
      .send({success :true})
    });

    // logout 
    app.post('/logout' , async( req ,res )=>{
         const user = req.body;
         res.clearCookie('token' ,{ ...cookieOptions, maxAge: 0}).send({success: true})
    })


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
 
     app.get('/appliedJobs/:email',logger, verifyToken, async(req, res)=>{
      // console.log(req.params.email)
      

      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'Forbidden access'})
      }
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

    // await client.db("admin").command({ ping: 1 });
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