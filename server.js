import express from 'express';
import dotenv from 'dotenv';
import { buscarUnidades } from './src/buscaCPF.js';
import { buscarBoleto } from './src/buscaBoleto.js';
import { buscaCondominio } from './src/buscaCondominio.js';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/busca-condominio', async (req, res) => {
    const {nomeCondominio} = req.body;
    const resposta = await buscaCondominio(nomeCondominio)
    return res.json(resposta);
})

app.post('/busca-unidades', async (req, res) => {

    const { idCondominio, cpf } = req.body;
    const resposta = await buscarUnidades(idCondominio, cpf);
    return res.json(resposta);

})

app.post('/webhook-boleto', async (req, res) => {

    const { idCondominio, idUnidade } = req.body;
    const resposta = await buscarBoleto( idCondominio, idUnidade );
    return res.json(resposta)

});

app.get('/', (req, res) => {

    res.send("Webhook rodadno na porta 3000")

})

app.listen(3000, () => {
    console.log("Webhook rodando na porta 3000")
})