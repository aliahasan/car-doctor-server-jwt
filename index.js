const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w7hlbnu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// my middlewares
// const logger = async (req, res, next) => {
//   console.log("called:", req.hostname, req.originalUrl);
//   next();
// };

const logger = (req, res , next) =>{
  console.log( 'log info :' , req.method, req.url )
  next()
}



// token verification
// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: "unauthorized access" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

const verifyToken = (req, res , next) =>{
  const token = req?.cookies?.token
  // console.log('token in the middleware ' , token)
  if(!token){
    return res.status(401).send({message : 'unauthorized access'})
  }
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err, decoded) =>{
    if(err) {
      return res.status(401).send({message : 'unauthorized access'})
    }
    req.user = decoded
    next()
  })
}

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");

    //  auth related api
    app.post("/jwt", logger , async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite:"none"
      })
        .send({ success: true });
    });

    // app.post("/logout", async (req, res) => {
    //   const user = req.body;
    //   console.log("loggout user", user);
    //   res.clearCookie( 'token' , { maxAge: 0 }).send({ success: true });
    // }); 
    app.post('/logout',  async (req, res) => {
      console.log("logout user", req.body);  
      res.clearCookie('token', {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/', 
      }).send({ success: true });
  });
  

    // services related api
    app.get("/services", logger,  async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    // bookings
    app.post("/bookings", verifyToken , async (req, res) => {
      const booking = req.body;
      // console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/bookings", logger , verifyToken, async (req, res) => {
      // console.log(req.query.email);
      console.log('token owner info' , req.user)
      console.log(" user in the  valid token", req.user);
      if (req.query?.email !== req.user?.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateBooking = req.body;
      // console.log(updateBooking);
      const updateDoc = {
        $set: {
          status: updateBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("doctor is running");
});

app.listen(port, () => {
  console.log(`Car doctor Server is running on port ${port}`);
});
