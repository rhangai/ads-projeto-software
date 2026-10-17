// Tipos espelhando as respostas da API (mesmos nomes de colunas do banco).

export type StatusCao = 'aguardando' | 'em_montagem' | 'entregue';
export type CategoriaMaterial = 'cano_pvc' | 'roda' | 'conector' | 'outro';

export interface Cao {
  id: number;
  nome_cao: string;
  nome_tutor: string;
  telefone_tutor: string;
  altura_cm: number;
  comprimento_cm: number;
  status: StatusCao;
}

export type NovoCao = Omit<Cao, 'id' | 'status'>;

export interface MaterialEstoque {
  id: number;
  nome_material: string;
  categoria_material: CategoriaMaterial;
  saldo_disponivel: number;
}

export interface Consumo {
  canos_pvc: number;
  rodas: number;
}

export interface CaoApto extends Cao {
  consumo: Consumo;
}

export interface ResultadoCompatibilidade {
  aptos: CaoApto[];
  saldo_atual: Consumo;
  saldo_apos_aptos: Consumo;
}
