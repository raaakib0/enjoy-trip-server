const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.98xvyli.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const serviceCollection = client.db('enjoyTrip').collection('services');
        const orderCollection = client.db('enjoyTrip').collection('orders');
        const userCollection = client.db('enjoyTrip').collection('users');
        const categoriesCollection = client.db('enjoyTrip').collection('categories');


        // NOTE: make sure you use verifyAdmin after verifyJWT
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        // app.post('/jwt', (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
        //     res.send({ token })
        // })

        app.get('/services', async (req, res) => {
            // const search = req.query.search
            // console.log(search);
            let query = {};
            // if (search.length) {
            //     query = {
            //         $text: {
            //             $search: search
            //         }
            //     }

            // }
            // const query = { price: { $gt: 100, $lt: 300 } }
            // const query = { price: { $eq: 200 } }
            // const query = { price: { $lte: 200 } }
            // const query = { price: { $ne: 150 } }
            // const query = { price: { $in: [20, 40, 150] } }
            // const query = { price: { $nin: [20, 40, 150] } }
            // const query = { $and: [{price: {$gt: 20}}, {price: {$gt: 100}}] }
            // const order = req.query.order === 'asc' ? 1 : -1;
            // const cursor = serviceCollection.find(query).sort({ price: order });
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        });


        // orders api
        ///////////////////////////////////////////////////

        // // app.get('/orders', verifyJWT, async (req, res) => {
        app.get('/orders', async (req, res) => {
            // const decoded = req.decoded;

            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: 'unauthorized access' })
            // }

            const email = req.query.email;

            // let query = {};
            const query = { email: email };
            // if (req.query.email) {
            //     query = {
            //         email: req.query.email
            //     }
            // }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        // app.post('/orders', verifyJWT, async (req, res) => {
        // app.post('/orders', async (req, res) => {
        //     const order = req.body;
        //     const result = await orderCollection.insertOne(order);
        //     res.send(result);
        // });
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });
        // // app.patch('/orders/:id', verifyJWT, async (req, res) => {
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc);
            res.send(result);
        });

        // // app.delete('/orders/:id', verifyJWT, async (req, res) => {
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        // user
        // ///////////////////////////////////////////////////////////////////

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // app.patch('/users/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const status = req.body.status
        //     const query = { _id: ObjectId(id) }
        //     const updatedDoc = {
        //         $set: {
        //             status: status
        //         }
        //     }
        //     const result = await orderCollection.updateOne(query, updatedDoc);
        //     res.send(result);
        // })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isSeller: user?.role2 === 'seller' });
        });

        // app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.put('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role2: 'seller'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoriesCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        })


    }
    finally {

    }

}

run().catch(err => console.error(err));


app.get('/', (req, res) => {
    res.send('enjoyTrip server is running')
})

app.listen(port, () => {
    console.log(`enjoyTrip server running on ${port}`);
})