import express from 'express';
import { json } from 'body-parser';
import { router as buscadorRouter } from './modules/buscador/controllers/BuscadorController';
import { router as reparadorRouter } from './modules/reparador/controllers/ReparadorController';

const app = express();

app.use(json());
app.use('/buscador', buscadorRouter);
app.use('/reparador', reparadorRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});