const express = require('express')
const session = require('express-session')
const router = express.Router()
router.use(
  session({
    secret: 'your-secret-key', // Замініть це справжнім секретним ключем
    resave: false,
    saveUninitialized: true,
  }),
)

class Product {
  static #list = []
  static #count = 0

  constructor(
    img,
    title,
    description,
    category,
    price,
    amount = 0,
  ) {
    this.id = ++Product.#count
    this.img = img
    this.title = title
    this.description = description
    this.category = category
    this.price = price
    this.amount = amount
  }

  static add(...data) {
    const newProduct = new Product(...data)
    this.#list.push(newProduct)
  }

  static getList() {
    return this.#list
  }

  static getById(id) {
    return this.#list.find((product) => product.id === id)
  }

  static getRandomList(id) {
    const filteredList = this.#list.filter(
      (product) => product.id !== id,
    )
    const shuffledList = filteredList.sort(
      () => Math.random() - 0.5,
    )
    return shuffledList.slice(0, 3)
  }
}

Product.add(
  'https://picsum.photos/200/300',
  'Компютер Arline Gaming (x43v31) AMD Ryzen 5 3600',
  'AMD Ryzen 5 3600 (3.6 - 4.2 ГГц / RAM 16 ГБ / HDD 1 ТБ + SSD 480 ГБ)',
  [{ id: 237, text: 'Топ продажів' }],
  28000,
  10,
)

class Purchase {
  static DELIVERY_PRICE = 150
  static #BONUS_FACTOR = 0.1
  static #count = 0
  static #list = []
  static #bonusAccount = new Map()

  static getBonusBalance(email) {
    return Purchase.#bonusAccount.get(email) || 0
  }

  static calcBonusAmount(value) {
    return value * Purchase.#BONUS_FACTOR
  }

  static updateBonusBalance(email, price, bonusUse = 0) {
    const amount = price * Purchase.#BONUS_FACTOR
    const currentBalance = Purchase.getBonusBalance(email)
    const updatedBalance =
      currentBalance + amount - bonusUse
    Purchase.#bonusAccount.set(email, updatedBalance)
    console.log(email, updatedBalance)
    return amount
  }

  constructor(data, product) {
    this.id = ++Purchase.#count
    this.firstname = data.firstname
    this.lastname = data.lastname
    this.phone = data.phone
    this.email = data.email
    this.comment = data.comment || null
    this.bonus = data.bonus || 0
    this.promocode = data.promocode || null
    this.totalPrice = data.totalPrice
    this.productPrice = data.productPrice
    this.deliveryPrice = data.deliveryPrice
    this.amount = data.amount
    this.product = product
  }

  static add(...arg) {
    const newPurchase = new Purchase(...arg)
    this.#list.push(newPurchase)
    return newPurchase
  }

  static getList() {
    return Purchase.#list.reverse()
  }

  static getById(id) {
    return Purchase.#list.find((item) => item.id === id)
  }

  static updateById(id, data) {
    const purchase = Purchase.getById(id)
    if (purchase) {
      if (data.firstname) {
        purchase.firstname = data.firstname
      }
      if (data.lastname) purchase.lastname = data.lastname
      if (data.phone) purchase.phone = data.phone
      if (data.email) purchase.email = data.email
      return true
    } else {
      return false
    }
  }
}

class Promocode {
  static #list = []

  constructor(name, factor) {
    this.name = name
    this.factor = factor
  }

  static add(name, factor) {
    const newPromoCode = new Promocode(name, factor)
    Promocode.#list.push(newPromoCode)
    return newPromoCode
  }

  static getByName(name) {
    return this.#list.find((promo) => promo.name === name)
  }

  static calc(promo, price) {
    return price * promo.factor
  }
}

Promocode.add('SUMMER2023', 0.9)
Promocode.add('DISCOUNT50', 0.5)
Promocode.add('SALE25', 0.75)

// ======

router.get('/', function (req, res) {
  res.render('purchase-index', {
    style: 'purchase-index',
    data: {
      list: Product.getList(),
    },
  })
})

router.get('/purchase-product', function (req, res) {
  const id = Number(req.query.id)

  res.render('purchase-product', {
    style: 'purchase-product',
    data: {
      list: Product.getRandomList(id),
      product: Product.getById(id),
    },
  })
})

router.post('/purchase-create', function (req, res) {
  const id = Number(req.query.id)
  const amount = Number(req.body.amount)

  if (amount < 1) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Некоректна кількість товару',
        link: `/purchase-product?id=${id}`,
      },
    })
  }

  const product = Product.getById(id)

  if (!product || product.amount < amount) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Такої кількості немає',
        link: `/purchase-product?id=${id}`,
      },
    })
  }

  const productPrice = product.price * amount
  const deliveryPrice = Purchase.DELIVERY_PRICE
  const totalPrice = productPrice + deliveryPrice
  const bonus = Purchase.calcBonusAmount(totalPrice)

  const order = {
    id: product.id,
    title: product.title,
    amount: amount,
    price: product.price,
    deliveryPrice: Purchase.DELIVERY_PRICE,
    bonus: bonus,
    totalPrice: totalPrice,
  }

  const orders = req.session.orders || []
  orders.push(order)
  req.session.orders = orders

  res.render('purchase-create', {
    style: 'purchase-create',
    data: {
      id: product.id,
      cart: [
        {
          text: `${product.title} (${amount} шт)`,
          price: productPrice,
        },
        {
          text: 'Доставка',
          price: Purchase.DELIVERY_PRICE,
        },
      ],
      totalPrice,
      productPrice,
      deliveryPrice: Purchase.DELIVERY_PRICE,
      amount,
      bonus,
    },
  })
})

router.post('/purchase-submit', function (req, res) {
  const id = Number(req.query.id)
  let {
    totalPrice,
    productPrice,
    deliveryPrice,
    amount,
    firstname,
    lastname,
    comment,
    phone,
    email,
    promocode,
    bonus,
  } = req.body
  const product = Product.getById(id)

  if (!product || product.amount < amount) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Товар не знайдено',
        link: '/purchase-list',
      },
    })
  }

  totalPrice = Number(totalPrice)
  productPrice = Number(productPrice)
  deliveryPrice = Number(deliveryPrice)
  amount = Number(amount)
  bonus = Number(bonus)

  if (
    isNaN(totalPrice) ||
    isNaN(productPrice) ||
    isNaN(deliveryPrice) ||
    isNaN(amount) ||
    isNaN(bonus)
  ) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Некоректні дані',
        link: '/purchase-list',
      },
    })
  }

  if (!firstname || !lastname || !email || !phone) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Заповніть обовязкові поля',
        info: 'Некоректні дані',
        link: '/purchase-list',
      },
    })
  }

  if (bonus > 0) {
    const bonusAmount = Purchase.getBonusBalance(email)
    if (bonus > bonusAmount) {
      bonus = bonusAmount
    }

    Purchase.updateBonusBalance(email, totalPrice, bonus)
    totalPrice -= bonus
  } else {
    Purchase.updateBonusBalance(email, totalPrice, 0)
  }

  if (promocode) {
    promocode = Promocode.getByName(promocode)
    if (promocode) {
      totalPrice = Promocode.calc(promocode, totalPrice)
    }
  }

  if (totalPrice < 0) totalPrice = 0

  const purchase = Purchase.add(
    {
      totalPrice,
      productPrice,
      deliveryPrice,
      amount,
      firstname,
      lastname,
      email,
      phone,
      promocode,
      bonus,
      comment,
    },
    product,
  )

  res.render('alert', {
    style: 'alert',
    data: {
      message: 'Операція успішна',
      info: 'Замовлення створено',
      link: '/purchase-list',
    },
  })
})

router.get('/alert', function (req, res) {
  res.render('alert', {
    style: 'alert',
    data: {
      message: 'Операція успішна',
      info: 'Товар створений',
      link: '/test-path',
    },
  })
})

router.get('/purchase-list', function (req, res) {
  const list = Purchase.getList()
  const bonus = Purchase.getBonusBalance(req.session.email)
  const data = {
    purchases: {
      list: list.map((purchase) => ({
        id: purchase.id,
        product: purchase.product.title,
        totalPrice: purchase.totalPrice,
        bonus: bonus,
      })),
    },
  }

  res.render('purchase-list', {
    style: 'purchase-list',
    data,
  })
})

router.get('/purchase-details/:id', function (req, res) {
  const id = Number(req.params.id)
  const purchase = Purchase.getById(id)

  if (!purchase) {
    return res.status(404).render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Замовлення не знайдено',
        link: '/purchase-list',
      },
    })
  }

  const bonus = Purchase.calcBonusAmount(
    purchase.totalPrice,
  )
  res.render('purchase-details', {
    style: 'purchase-details',
    data: {
      id: purchase.id,
      firstname: purchase.firstname,
      lastname: purchase.lastname,
      phone: purchase.phone,
      email: purchase.email,
      product: purchase.product.title,
      productPrice: purchase.productPrice,
      deliveryPrice: purchase.deliveryPrice,
      totalPrice: purchase.totalPrice,
      bonus: bonus,
    },
  })
})

module.exports = router

module.exports = router
