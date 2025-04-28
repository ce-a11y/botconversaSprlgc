import axios from 'axios';
import {limparCPF, validarCPF} from './functions.js';
import { logger} from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = "https://api.superlogica.net/v2/condor";
const APP_TOKEN = process.env.APP_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const HEADERS = {
    "Content-Type": "application/json",
    "app_token": APP_TOKEN,
    "access_token": ACCESS_TOKEN
}

const itensPorPagina = 50;
const MAX_PAGINAS = 10;

//REALIZA A BUSCA PELO CPF

export async function buscarUnidades(idCondominio, cpf) {
    
    if (!idCondominio || !cpf) {
        logger.warn('ID do Condomínio ou CPF não informado.');
        return { mensagem: "Erro: informe o ID do Condomínio e o CPF!" }
    }

    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
        logger.warn(`CPF inválido informado: ${cpf}`);
        return { mensagem: "Erro: CPF inválido." }
    }

     try {   
        logger.info(`Buscando unidades para o Condomínio ID: ${idCondominio} e CPF: ${cpfLimpo}`);

        let unidades = await buscarUnidadesCPF(idCondominio, cpf);

        if (!unidades || unidades.length === 0) {
        logger.warn('Não encontrado diretamente, buscando paginadamente todas as unidades.');
        unidades = await buscarUnidadesPaginadas(idCondominio, cpfLimpo);
    }

    if (unidades.length === 0) {
        logger.warn('Nenhuma unidade encontrada após busca paginada.');
        return { mensagem: "Erro: Nenhuma unidade encontrada para o CPF informado." };
    }
    
    logger.info(`Encontradas ${unidades.length} unidades para o Condomínio ID: ${idCondominio} e CPF: ${cpfLimpo}.`);
    //retorna unidades em lista
    let opcoes = unidades.map(u => ({
        id: u.id_unidade_uni,
        nome: u.st_bloco_uni.length >= 1 ? `${u.st_unidade_uni} - ${u.st_bloco_uni}` : u.st_unidade_uni
    }))

    return {
    mensagem: unidades > 1 ? "Várias unidade encontradas, selecione a que você quer!" : "Encontrei essa unidade. Confirme.",
    unidades: opcoes
    }

        
    }  catch (error) {
        logger.error(`Erro ao buscar unidade: ${error.message}`);
     
        if (error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
                return { mensagem: "Erro de autenticação. Verifique o app_token e access_token." };
            } else if (error.response.status === 404) {
                return { mensagem: "Dados não encontrados (404). Verifique o ID do condomínio ou CPF." };
            } else if (error.response.status >= 500) {
                return { mensagem: "Erro interno no servidor da Superlógica. Tente novamente em alguns minutos." };
            } else {
                return { mensagem: `Erro desconhecido da API (status ${error.response.status}).` };
            }
        } else if (error.request) {
            return { mensagem: "Falha de comunicação com a API da Superlógica. Verifique a conexão de rede." };
        } else {
            return { mensagem: `Erro inesperado: ${error.message}` };
        }
    }
    }


async function buscarUnidadesCPF(idCondominio, cpf) {
        
    const response = await axios.get(`${BASE_URL}/unidades`, {
    params: {"idCondominio": idCondominio, "pesquisa": cpf},
    headers: HEADERS
    });

    logger.info(`Encontradas ${response.data.length} unidades diretamente pela busca.`);

    return response.data ?? [];
}

async function buscarUnidadesPaginadas(idCondominio, cpf) {
    
    let paginaAtual = 1;
    let unidadesEncontradas = [];
    while (paginaAtual <= MAX_PAGINAS) {
        
        const unidadeResponse = await axios.get(`${BASE_URL}/unidades`, {
            params: {
                idCondominio,
                "itensPorPagina": 50,
                "pagina": paginaAtual,
                // "exibirDadosDosContatos": 1,
            },
            headers: HEADERS
        });

        const unidadesPagina = unidadeResponse.data;

        if (!unidadesPagina || unidadesPagina.length === 0) {
            break; // Chegou no final
        }

        const filtradas = unidadesPagina.filter(u => u.cpf_proprietario === cpf);
        unidadesEncontradas.push(...filtradas);

        if (unidadesPagina.length < 50) {
            break; // Última página
        }
        logger.info(`Buscando unidades do Condomínio de ID ${idCondominio} vinculadas ao CPF ${cpf} na página ${paginaAtual}.`);
        paginaAtual++; // Próxima página
    }
    logger.info(`Final da paginação alcançado na página ${paginaAtual - 1}.`);
    return unidadesEncontradas ?? [];

}
