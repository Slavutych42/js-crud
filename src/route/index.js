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

class Track {
  static #list = []

  constructor(name, author, image) {
    this.id = Math.floor(1000 + Math.random() * 9000)
    this.name = name
    this.author = author
    this.image = image
  }

  static create(name, author, image) {
    const newTrack = new Track(name, author, image)
    this.#list.push(newTrack)
    return newTrack
  }

  static getList() {
    return this.#list.reverse()
  }

  static getById(id) {
    return this.#list.find((track) => track.id === id)
  }
}

Track.create(
  'Інь Янь',
  'Monatic',
  'https://picsum.photos/100/100',
)

Track.create(
  'Песс',
  'Monatic',
  'https://picsum.photos/100/100',
)

Track.create(
  'Кіт',
  'Monatic',
  'https://picsum.photos/100/100',
)
console.log(Track.getList())

class Playlist {
  static #list = []
  constructor(name) {
    this.id = Math.floor(1000 + Math.random() * 9000)
    this.name = name
    this.tracks = []
    this.image = 'https://picsum.photos/100/100'
  }

  static create(name) {
    const newPlayList = new Playlist(name)
    this.#list.push(newPlayList)
    return newPlayList
  }

  static getList() {
    return this.#list.reverse()
  }

  static makeMix(playlist) {
    const allTracks = Track.getList()
    let randomTracks = allTracks
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)

    playlist.tracks.push(...randomTracks)
  }

  static getById(id) {
    return (
      Playlist.#list.find(
        (playlist) => playlist.id === id,
      ) || null
    )
  }

  deleteTrackById(trackId) {
    this.tracks = this.tracks.filter(
      (track) => track.id !== trackId,
    )
  }

  static findListByValue(value) {
    return this.#list.filter((playlist) =>
      playlist.name
        .toLowerCase()
        .includes(value.toLowerCase()),
    )
  }
}

Playlist.makeMix(Playlist.create('Test1'))
Playlist.makeMix(Playlist.create('Test2'))
Playlist.makeMix(Playlist.create('Test3'))

router.get('/', function (req, res) {
  res.render('spotify-choose', {
    style: 'spotify-choose',
    data: {},
  })
})

router.get('/spotify-choose', function (req, res) {
  res.render('spotify-choose', {
    style: 'spotify-choose',
    data: {},
  })
})

router.get('/spotify-create', function (req, res) {
  const isMix = !!req.query.isMix

  console.log(isMix)

  res.render('spotify-create', {
    style: 'spotify-create',
    data: {
      isMix,
    },
  })
})

router.post('/spotify-create', function (req, res) {
  const isMix = !!req.query.isMix

  const name = req.body.name

  if (!name) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Введіть назву плейліста',
        link: isMix
          ? '/spotify-create?isMix=true'
          : '/spotify-create',
      },
    })
  }

  const playlist = Playlist.create(name)

  if (isMix) {
    Playlist.makeMix(playlist)
  }

  console.log(playlist)

  res.render('spotify-playlist', {
    style: 'spotify-playlist',
    data: {
      playlistId: playlist.id,
      tracks: playlist.tracks,
      name: playlist.name,
    },
  })
})

router.get('/spotify-playlist', function (req, res) {
  const id = Number(req.query.id)

  const playlist = Playlist.getById(id)

  if (!playlist) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Такого плейліста не знайдено',
        link: '/',
      },
    })
  }

  res.render('spotify-playlist', {
    style: 'spotify-playlist',
    data: {
      playlistId: playlist.id,
      tracks: playlist.tracks,
      name: playlist.name,
    },
  })
})

router.get('/spotify-track-delete', function (req, res) {
  const playlistId = Number(req.query.playlistId)

  const trackId = Number(req.query.trackId)

  const playlist = Playlist.getById(playlistId)

  if (!playlist) {
    return res.render('alert', {
      style: 'alert',
      data: {
        message: 'Помилка',
        info: 'Такого плейліста не знайдено',
        link: `/spotify-playlist?id=${playlistId}`,
      },
    })
  }

  playlist.deleteTrackById(trackId)

  res.render('spotify-playlist', {
    style: 'spotify-playlist',
    data: {
      playlistId: playlist.id,
      tracks: playlist.tracks,
      name: playlist.name,
    },
  })
})

router.get('/spotify-search', function (req, res) {
  const value = ''

  const list = Playlist.findListByValue(value)

  res.render('spotify-search', {
    style: 'spotify-search',
    data: {
      list: list.map(({ tracks, ...rest }) => ({
        ...rest,
        amount: tracks.length,
      })),
      value,
    },
  })
})

router.post('/spotify-search', function (req, res) {
  const value = req.body.value || ''

  const list = Playlist.findListByValue(value)

  console.log(value)

  res.render('spotify-search', {
    style: 'spotify-search',
    data: {
      list: list.map(({ tracks, ...rest }) => ({
        ...rest,
        amount: tracks.length,
      })),
      value,
    },
  })
})

router.get('/spotify-playlistAdd', function (req, res) {
  const tracks = Track.getList()
  const playlistId = req.query.id
  console.log(tracks, playlistId)
  res.render('spotify-playlistAdd', {
    style: 'spotify-playlistAdd',
    data: {
      tracks,
      playlistId,
    },
  })
})

router.post('/spotify-playlistAdd', function (req, res) {
  console.log(req.body.trackId, req.body.playlistId)
  const trackId = parseInt(req.body.trackId, 10)
  let playlistId = parseInt(req.body.playlistId, 10)

  if (isNaN(trackId) || isNaN(playlistId)) {
    // Перевірка чи ID є числами
    return res.status(400).render('alert', {
      data: {
        message: 'Помилка',
        info: 'ID треку або плейліста не є числом.',
      },
    })
  }

  const track = Track.getById(trackId)
  const playlist = Playlist.getById(playlistId)

  if (!track || !playlist) {
    // Перевірка чи існують об'єкти з такими ID
    return res.status(404).render('alert', {
      data: {
        message: 'Помилка',
        info: 'Плейлист або трек не знайдено.',
      },
    })
  }

  // Додаємо трек у плейлист
  playlist.tracks.push(track)

  // Рендеримо сторінку плейлиста з оновленим списком треків
  res.render('spotify-playlist', {
    style: 'spotify-playlist',
    data: {
      playlistId: playlist.id,
      tracks: playlist.tracks,
      name: playlist.name,
    },
  })
})

module.exports = router
