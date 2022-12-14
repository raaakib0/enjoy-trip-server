const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.98xvyli.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//         return res.status(401).send({ message: 'unauthorized access' });
//     }
//     const token = authHeader.split(' ')[1];

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'Forbidden access' });
//         }
//         req.decoded = decoded;
//         next();
//     })
// }


async function run() {
    try {
        const vehicleCollection = client.db('enjoyTrip').collection('vehicles');
        const orderCollection = client.db('enjoyTrip').collection('orders');
        const userCollection = client.db('enjoyTrip').collection('users');
        const categoriesCollection = client.db('enjoyTrip').collection('categories');
        const paymentsCollection = client.db('enjoyTrip').collection('payments');
        
        
        // mail send function

        function sendBookingEmail(order) {
            const { email, sellerEmail,vehicleName, startDate, days } = order;

            const auth = {
                auth: {
                    api_key: process.env.EMAIL_SEND_KEY,
                    domain: process.env.EMAIL_SEND_DOMAIN
                }
            }

            const transporter = nodemailer.createTransport(mg(auth));


            // let transporter = nodemailer.createTransport({
            //     host: 'smtp.sendgrid.net',
            //     port: 587,
            //     auth: {
            //         user: "apikey",
            //         pass: process.env.SENDGRID_API_KEY
            //     }
            // });
            console.log('sending email', email)
            transporter.sendMail({
                from: "enjoy.trip@gmail.com", // verified sender email
                to: email || 'raaakib0@gmail.com', // recipient email
                subject: `Your Vehicle ${vehicleName} is Ordered`, // Subject line
                text: "Hello world!", // plain text body
                html: `
        <h3>Your Vehicle is ordered</h3>
        <div>
            <p>Your Vehicle : ${vehicleName}</p>
            <p> Date: ${startDate} for ${days} Days</p>
            <p>Thanks from Enjoy Trip.</p>
        </div>
        
        `, // html body
            }, function (error, info) {
                if (error) {
                    console.log('Email send error', error);
                } else {
                    console.log('Email sent: ' + info);
                }
            });
        }

        // const verifyAdmin = async (req, res, next) => {
        //     const decodedEmail = req.decoded.email;
        //     const query = { email: decodedEmail };
        //     const user = await userCollection.findOne(query);

        //     if (user?.role !== 'admin') {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }
        //     next();
        // }

        // app.post('/jwt', (req, res) => {
        //     const user = req.body;
        //     const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
        //     res.send({ token })
        // })
        app.get('/vehicles3', async (req, res) => {
            const categorie = req.query.categorie;
            // console.log(categorie)
            const query = { categorie: categorie };
            const cursor = vehicleCollection.find(query);
            const vehicles = await cursor.toArray();
            res.send(vehicles);
        });
        app.get('/vehicles', async (req, res) => {
            const email = req.query.email;
            // console.log(email)
            const query = { email: email };
            const cursor = vehicleCollection.find(query);
            const vehicles = await cursor.toArray();
            res.send(vehicles);
        });
        app.get('/vehicles2', async (req, res) => {
            const search = req.query.search
            // console.log(search);
            let query = {};
            if (search.length) {
                query = {
                    $text: {
                        $search: search
                    }
                }
            }
            // const email = req.query.email;
            // console.log(email)


            // const query = { email: email };

            const cursor = vehicleCollection.find(query);
            const vehicles = await cursor.toArray();

            // const query = { price: { $gt: 100, $lt: 300 } }
            // const query = { price: { $eq: 200 } }
            // const query = { price: { $lte: 200 } }
            // const query = { price: { $ne: 150 } }
            // const query = { price: { $in: [20, 40, 150] } }
            // const query = { price: { $nin: [20, 40, 150] } }
            // const query = { $and: [{price: {$gt: 20}}, {price: {$gt: 100}}] }
            // const order = req.query.order === 'asc' ? 1 : -1;
            // const cursor = vehicleCollection.find(query).sort({ price: order });

            res.send(vehicles);
        });
        app.get('/vehicles4', async (req, res) => {
        
            let query = {};
           
            const cursor = vehicleCollection.find(query);
            const vehicles = await cursor.toArray();

            res.send(vehicles);
        });

        app.get('/vehicles/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const vehicle = await vehicleCollection.findOne(query);
            res.send(vehicle);
        });
        app.post('/vehicles', async (req, res) => {
            const vehicle = req.body;
            const result = await vehicleCollection.insertOne(vehicle);
            res.send(result);
        });
        // app.delete('/doctors/:id', verifyJWT, verifyAdmin, async (req, res) => {
        app.delete('/vehicles/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await vehicleCollection.deleteOne(filter);
            res.send(result);
        });
        app.put('/updateVehicle/:id', async (req, res) => {
            const id = req.params.id;
            const body = req.body;
            console.log(body)
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    name: body.name,
                    price: body.price,
                    description: body.description
                }
            }
            const result = await vehicleCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        // orders api
        ///////////////////////////////////////////////////

        app.get('/orders3', async (req, res) => {
            const query = {};
            const orders = await orderCollection.find(query).toArray();
            res.send(orders);
        });
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
        app.get('/orders2', async (req, res) => {
            // const decoded = req.decoded;

            // if (decoded.email !== req.query.email) {
            //     res.status(403).send({ message: 'unauthorized access' })
            // }
            const sellerEmail = req.query.sellerEmail;
            // let query = {};
            const query = { sellerEmail: sellerEmail };
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
            sendBookingEmail(order)
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

        // Payment/////////////////////////////////////////////////////////////
        app.post('/create-payment-intent', async (req, res) => {
            const totalAmount = req.body;
            const price = totalAmount.total;
            // console.log(price)
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const email = payment.email
            // console.log(email)
            const filter = { email: email }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await orderCollection.updateMany(filter, updatedDoc, options)
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
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const filter = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(filter);
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
        app.put('/users/removeAdmin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'Remove Admin'
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
        app.put('/users/removeSeller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role2: true
                }

            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)

            // const filter = { email: ObjectId(email) }
            // const options = { upsert: true };
            // const updatedDoc = {
            //     $set: {
            //         role2: 'seller'
            //     }
            // }
            // const result = await userCollection.updateOne(filter, updatedDoc, options);
            // res.send(result);
        });

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoriesCollection.find(query).project({ name: 1 }).toArray();
            res.send(result);
        });
        app.get('/categories2', async (req, res) => {
            const query = {}
            const result = await categoriesCollection.find(query).toArray();
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