const express = require('express')
const router = express.Router()

// ================================================================
class User {
  static #list = []

  constructor(email, login, password) {
    this.email = email
    this.login = login
    this.password = password
    this.id = new Date().getTime()
  }

  verifyPassword = (password) => this.password === password

  static add = (user) => {
    this.#list.push(user)
  }

  static getList = (user) => {
    return this.#list
  }

  static getById = (id) =>
    this.#list.find((user) => user.id === id)

  static deleteById = (id) => {
    const index = this.#list.findIndex(
      (user) => user.id === id,
    )
    if (index !== -1) {
      this.#list.splice(index, 1)
      return true
    } else {
      return false
    }
  }

  static updateById = (id, data) => {
    const user = this.getById(id)

    if (user) {
      this.update(user, data)
      return true
    } else {
      return false
    }
  }

  static update = (user, { email }) => {
    if (email) {
      user.email = email
    }
  }
}

// ======

class Product {
  #list = []
  #idCounter = 1

  getList() {
    return this.#list
  }

  add(product) {
    product.id = this.#idCounter++
    this.#list.push(product)
  }

  getById(id) {
    return this.#list.find((product) => product.id === id)
  }

  updateById(id, data) {
    const product = this.getById(id)
    if (product) {
      if (data.name) product.name = data.name
      if (data.price) product.price = parseFloat(data.price)
      if (data.description)
        product.description = data.description
      return true
    }
    return false
  }

  deleteById(id) {
    const index = this.#list.findIndex(
      (product) => product.id === id,
    )
    if (index !== -1) {
      this.#list.splice(index, 1)
      return true
    }
    return false
  }
}

const productModel = new Product()

router.get('/', function (req, res) {
  const list = User.getList()
  res.render('index', {
    style: 'index',
    data: {
      users: {
        list,
        isEmpty: list.length === 0,
      },
    },
  })
})

router.post('/success-info', function (req, res) {
  const { email, login, password } = req.body

  const user = new User(email, login, password)

  User.add(user)

  console.log(User.getList())

  res.render('success-info', {
    style: 'success-info',
    info: 'Користувач створений',
  })
})

router.get('/success-info', function (req, res) {
  const { id } = req.query

  User.deleteById(Number(id))

  res.render('success-info', {
    style: 'success-info',
    info: 'Користувач видалений',
  })
})

router.post('/user-update', function (req, res) {
  const { email, password, id } = req.body
  let result = false
  const user = User.getById(Number(id))

  if (user.verifyPassword(password)) {
    User.update(user, { email })
    result = true
  }

  res.render('success-info', {
    style: 'success-info',
    info: result ? 'Email оновлений' : 'Сталась помилка',
  })
})

router.get('/product-create', function (req, res) {
  res.render('product-create', {
    style: 'product-create',
  })
})

router.post('/product-create', function (req, res) {
  const { name, price, description } = req.body

  if (!name || isNaN(parseFloat(price)) || !description) {
    const info = 'Неправильні дані для створення товару'
    res.render('product-alert', {
      style: 'product-alert',
      data: { info },
    })
  } else {
    const product = {
      name,
      price: parseFloat(price),
      description,
    }

    productModel.add(product)

    const info = 'Товар успішно створений'
    res.render('product-alert', {
      style: 'product-alert',
      data: { info },
    })
  }
})

router.get('/product-list', function (req, res) {
  const products = productModel.getList()
  res.render('product-list', {
    style: 'product-list',
    data: { products },
  })
})

router.post('/product-list', function (req, res) {
  const { productId, action } = req.body

  if (action === 'delete') {
    const success = productModel.deleteById(
      Number(productId),
    )
    if (success) {
      const info = 'Товар був успішно видалений'
      res.render('product-alert', {
        style: 'product-alert',
        data: { info },
      })
    } else {
      const info = 'Товар з таким ID не знайдено'
      res.render('product-alert', {
        style: 'product-alert',
        data: { info },
      })
    }
  } else if (action === 'edit') {
    res.redirect(`/product-edit?id=${productId}`)
  }
})

router.get('/product-alert', function (req, res) {
  const info = 'Операція успішно виконана'
  res.render('product-alert', {
    style: 'product-alert',
    data: { info },
  })
})

router.get('/product-edit', function (req, res) {
  const productId = req.query.id
  const product = productModel.getById(Number(productId))
  if (product) {
    res.render('product-edit', {
      style: 'product-edit',
      data: { product }, // Передача об'єкта товару у шаблон
    })
  } else {
    const info = 'Товар з таким ID не знайдено'
    res.render('product-alert', {
      style: 'product-alert',
      data: { info },
    })
  }
})

router.post('/product-edit', function (req, res) {
  const { productId, name, price, description } = req.body
  const data = { name, price, description }
  const success = productModel.updateById(
    Number(productId),
    data,
  )

  if (success) {
    const info = 'Дані товару були оновлені'
    res.render('product-alert', {
      style: 'product-alert',
      data: { info },
    })
  } else {
    const info = 'Помилка при оновленні товару'
    res.render('product-alert', {
      style: 'product-alert',
      data: { info },
    })
  }
})

router.get('/product-delete', function (req, res) {
  const productId = req.query.id
  if (!productId) {
    const info = 'ID товару не вказано'
    res.render('product-alert', {
      style: 'product-alert',
      data: { info },
    })
  } else {
    const success = productModel.deleteById(
      Number(productId),
    )
    if (success) {
      const info = 'Товар був успішно видалений'
      res.render('product-alert', {
        style: 'product-alert',
        data: { info },
      })
    } else {
      const info = 'Товар з таким ID не знайдено'
      res.render('product-alert', {
        style: 'product-alert',
        data: { info },
      })
    }
  }
})
// ↑↑ сюди вводимо JSON дані

// ================================================================

// Підключаємо роутер до бек-енду
module.exports = router
