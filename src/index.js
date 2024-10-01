const express = require('express')
const cors = require('cors')
const { Sequelize, DataTypes } = require('sequelize')
require('dotenv').config()


const sequelize = new Sequelize(
  process.env.DB_NAME || 'financial_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
  }
);


const Transaction = sequelize.define('Transaction', {
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('entrada', 'saida'),
    allowNull: false,
  },
}, {
  timestamps: true,
});

sequelize.sync()
  .then(() => console.log('Banco de dados conectado e sincronizado com sucesso'))
  .catch(error => console.error('Erro ao conectar ao banco de dados:', error))


const app = express()
const port = process.env.PORT || 3000


app.use(cors())
app.use(express.json())




app.post('/transactions/add', async (req, res) => {
  const { description, value, type } = req.body
  try {
    const transaction = await Transaction.create({ description, value, type })
    res.status(201).json(transaction)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar transação', message: error.message })
  }
})


app.put('/transactions/:id', async (req, res) => {
  const { id } = req.params
  const { description, value, type } = req.body
  try {
    const transaction = await Transaction.findByPk(id)
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' })
    }
    await transaction.update({ description, value, type })
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar transação', message: error.message })
  }
})


app.get('/transactions/all', async (req, res) => {
  try {
    const transactions = await Transaction.findAll()
    res.status(200).json(transactions)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transações', message: error.message })
  }
})


app.get('/transactions/balance', async (req, res) => {
  try {
    const transactions = await Transaction.findAll()
    const total = transactions.reduce((acc, transaction) => {
      return transaction.type === 'entrada' ? acc + transaction.value : acc - transaction.value
    }, 0)
    res.status(200).json({ total })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular o saldo', message: error.message })
  }
})


app.delete('/transactions/:id', async (req, res) => {
  const { id } = req.params
  try {
    const transaction = await Transaction.findByPk(id)
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' })
    }
    await transaction.destroy()
    const transactions = await Transaction.findAll()
    const total = transactions.reduce((acc, transaction) => {
      return transaction.type === 'entrada' ? acc + transaction.value : acc - transaction.value;
    }, 0)
    res.status(200).json({ message: 'Transação excluída com sucesso', total })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir a transação', message: error.message })
  }
})



app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})
