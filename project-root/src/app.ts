import express from 'express';
import { json } from 'body-parser';
import BuscadorController from './modules/buscador/controllers/BuscadorController';
import ReparadorController from './modules/reparador/controllers/ReparadorController';

const app = express();

app.use(json());
app.use('/buscador', new BuscadorController().getRouter());
app.use('/reparador', new ReparadorController().getRouter());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;