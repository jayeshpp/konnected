/* import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env file

const fastify = Fastify();

// Define the webhook payload type
interface UserCreatedPayload {
  user_id: string;
  email: string;
  metadata: any;
}

// Basic webhook handler
fastify.post('/webhook/user-created', async (request, reply) => {
  try {
    const payload: UserCreatedPayload = request.body; // Type the payload

    // Handle the webhook payload, e.g. save to database
    console.log('Received user created event:', payload);

    // Send a response to acknowledge the event
    return reply.status(200).send({ message: 'User created event received' });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start server
fastify.listen(3002, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Supabase Webhook listening at ${address}`);
});
 */
