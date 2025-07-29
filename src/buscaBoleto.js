import axios from 'axios';
import dotenv from 'dotenv';
import { formatarData, formatarDataParaAPI, obterPeriodoDias } from './functions.js';
import { logger } from './logger.js';


const BASE_URL = "https://api.superlogica.net/v2/condor";
const APP_TOKEN = process.env.APP_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

dotenv.config();

const hoje = new Date();

// Busca os boletos dos últimos 30 dias

export async function buscarBoleto(idCondominio, idUnidade) {
    
    if (!idCondominio || !idUnidade) {
        logger.warn('ID do condomínio ou ID da unidade não fornecido.');
        return {mensagem: "Erro: informe o ID do condomínio e o ID da unidade."}
    }

    let unidadeId = idUnidade
    const periodoDias = obterPeriodoDias(idCondominio);
    let diasAntes = new Date(hoje);
    diasAntes.setDate(hoje.getDate() - periodoDias);
    
    const dtInicio = formatarDataParaAPI(diasAntes);

    logger.info(`Buscando boletos para idCondominio: ${idCondominio} e idUnidade: ${idUnidade}`);

    try {
    
    const boletoResponse = await axios.get(`${BASE_URL}/cobranca/index`, {
        params: {
            status: "pendentes",
            apenasColunasPrincipais: 1,
            idCondominio: idCondominio,
            dtInicio: dtInicio,
            //dtFim: "",
            UNIDADES: unidadeId,
            itensPorPagina: 10,
            pagina: 1
        },
        headers: {
            "Content-Type": "application/json",
            "app_token": APP_TOKEN,
            "access_token": ACCESS_TOKEN
        }
    });

    const boletos = boletoResponse.data;

    if (!boletos || boletos.length === 0) {
        logger.warn(`Nenhum boleto pendente encontrado para unidade: ${idUnidade}`);
        return {mensagem: "Nenhum boleto com menos de 30 dias de atraso encontrado para esta unidade. \n\n Para boletos vencidos há mais de 30 dias, entre em contato com um atendente para verificar sua situação."}
    }

    boletos.sort((a, b) => new Date(a.dt_vencimento_recb) - new Date(b.dt_vencimento_recb));
    logger.info(`Encontrados ${boletos.length} boletos para unidade ID ${idUnidade}`);

    let resposta = boletos.length > 1 ? `✅ Certo! Encontrei ${boletos.length} boletos em aberto. \n\n Aqui estão eles:` : `✅ Certo! Encontrei *um* boleto em aberto:\n\n`
    

    boletos.forEach((boleto, index) => {
        resposta += `📌 Boleto ${index + 1}:\n`;
        resposta += `💰 Valor: R$ ${boleto.vl_total_recb}\n`;
        resposta += `📅 Vencimento: ${formatarData(boleto.dt_vencimento_recb)}\n`;
        resposta += `🔗 Link: ${boleto.link_segundavia}\n\n`
    });

    resposta += `Para boletos vencidos há mais de ${periodoDias} dias, entre em contato com um atendente para verificar sua situação.`
    
    return {mensagem: resposta};

}
catch (error) {
    logger.error(`Erro ao buscar boletos para unidade ${idUnidade}: ${error.message}`);
    return { mensagem: "Erro ao buscar unidade. Tente novamente mais tarde."}
}


}