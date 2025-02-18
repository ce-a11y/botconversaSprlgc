import axios from 'axios';
import {limparCPF, validarCPF} from './functions.js';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = "https://api.superlogica.net/v2/condor";
const APP_TOKEN = process.env.APP_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

//REALIZA A BUSCA PELO CPF

export async function buscarUnidades(idCondominio, cpf) {
    
    if (!idCondominio || !cpf) {
        return { mensagem: "Erro: informe o ID do Condomínio e o CPF!" }
    }

    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
        return { mensagem: "Erro: CPF inválido." }
    }

     try {   
       
        // busca todas as unidades do condominio
        const unidadeResponse = await axios.get(`${BASE_URL}/unidades`, {
        params: {idCondominio},
        headers: {
            "Content-Type": "application/json",
            "app_token": APP_TOKEN,
            "access_token": ACCESS_TOKEN
        }
    });
    
        const unidades = unidadeResponse.data;

        if (!unidades || unidades.length === 0) {
            return res.json({mensagem: "Erro: não foi encontrada nenhuma unidade para esse condomínio."})
        }

        let unidadesDoMorador = unidades.filter(u => u.cpf_proprietario === cpfLimpo);

        if (unidadesDoMorador.length === 0) {
            return res.json ({mensagem: "Erro: Nenhuma unidade encontrada para o CPF informado."})
        }

        //retorna unidades em lista

        let opcoes = unidadesDoMorador.map(u => ({
        id: u.id_unidade_uni,
        nome: u.st_bloco_uni.length > 3 ? `${u.st_unidade_uni} - ${u.st_bloco_uni}` : u.st_unidade_uni
        }))

        return {
        mensagem: unidadesDoMorador > 1 ? "Várias unidade encontradas, selecione a que você quer!" : "Encontrei essa unidade. Confirme.",
        unidades: opcoes
        }
        }
    
    catch (error) {
        console.error("Erro ao buscar unidade.", error);
        return { mensagem: `Erro ao buscar unidade. Tente novamente mais tarde.`};
    }

};
