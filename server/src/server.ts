import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import searchRouter from './routes/routes'

config();

const app = express();

// middlewares
app.use(
  cors({
    origin:process.env.ALLOWED_ORIGIN,

  })
)
app.use(express.json());

// search router
app.use('/api/user', searchRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
})