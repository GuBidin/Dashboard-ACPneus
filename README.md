# 🛞 Dashboard AC Pneus

Sistema completo de **gestão, registro e análise de atendimentos** para borracharia e serviços automotivos da **AC Pneus**.

Este dashboard foi desenvolvido para controlar **funcionários, serviços, atendimentos do dia, faturamento e desempenho da equipe** em tempo real, com integração direta ao banco de dados via **Supabase**.

---

## 🎯 Objetivo do Sistema

O Dashboard AC Pneus foi criado para resolver um problema comum em borracharias:

> ❌ Falta de controle dos atendimentos do dia
> ❌ Dificuldade para saber quanto faturou
> ❌ Não saber qual funcionário produziu mais
> ❌ Falta de histórico organizado
> ❌ Anotações em papel que se perdem

Com este sistema, tudo passa a ser **digital, automático e visual**.

---

## 🖥️ Funcionalidades Principais

### 📊 Painel (Dashboard)

* Total de veículos atendidos no dia
* Faturamento diário automático
* Funcionário que mais produziu
* Horário de maior movimento
* Gráfico dos serviços mais realizados
* Gráfico de movimento por horário
* Ranking de funcionários por desempenho
* Lista dos últimos atendimentos

### 📝 Registrar Atendimento

Cadastro rápido de:

* Placa do veículo
* Tipo (Caminhão ou Carreta)
* Serviço realizado
* Valor cobrado
* Funcionário responsável

Tudo salvo diretamente no banco em segundos.

### ⚙️ Gerenciar Sistema

Cadastro e remoção de:

* Funcionários
* Serviços e preços sugeridos

---

## 🔐 Segurança e Sessão

O sistema possui:

* Controle de sessão via `localStorage`
* Expiração automática de login
* Redirecionamento para tela de login ao expirar
* Autenticação via token do **Supabase**

---

## 🧠 Inteligência do Painel

O painel não apenas mostra dados — ele **analisa**:

* Descobre automaticamente o horário mais cheio
* Calcula o faturamento somando todos atendimentos
* Gera ranking automático da equipe
* Atualiza os dados a cada 30 segundos

---

## 🗂️ Estrutura do Banco (Supabase)

Tabelas utilizadas:

| Tabela       | Função                               |
| ------------ | ------------------------------------ |
| funcionarios | Cadastro da equipe                   |
| servicos     | Serviços oferecidos e preço sugerido |
| atendimentos | Registro de todos os atendimentos    |

---

## 🚀 Tecnologias Utilizadas

* HTML
* CSS
* JavaScript puro (Vanilla JS)
* **Supabase** (Banco de dados e API REST)
* LocalStorage (controle de sessão)

Sem frameworks. Leve. Rápido. Direto ao ponto.

---

## 🔄 Atualização em Tempo Real

O sistema atualiza automaticamente o painel a cada **30 segundos**, garantindo que os dados estejam sempre atualizados na tela.

---

## 💰 Benefícios para a AC Pneus

✅ Fim do caderno e papel
✅ Controle total do faturamento diário
✅ Métrica clara de desempenho dos funcionários
✅ Organização dos serviços prestados
✅ Histórico confiável salvo em nuvem
✅ Visual moderno e profissional

---

## ▶️ Como Usar

1. Fazer login
2. Registrar atendimentos ao longo do dia
3. Acompanhar tudo pelo Painel
4. Gerenciar funcionários e serviços quando necessário

Simples assim.

---

## 🧩 Filosofia do Projeto

Este sistema foi pensado para a realidade da borracharia:

> **Poucos cliques, tela limpa, informação clara e registro rápido.**

Sem complicação. Sem excesso. Apenas o que realmente importa no dia a dia.

---

## 📌 Observação Importante

Este dashboard depende do **Supabase** corretamente configurado com as três tabelas citadas.
A comunicação com o banco é feita exclusivamente pela função central `api()`.

---

## 🏁 Resultado

O Dashboard AC Pneus transforma a gestão da borracharia em um **processo digital, organizado, mensurável e profissional**.

> Uma borracharia comum trabalha no papel.
> A **AC Pneus** trabalha com dados.

