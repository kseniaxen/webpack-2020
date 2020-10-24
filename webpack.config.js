// для составления путей к файлам и каталогам в файловой системе
const path = require('path')
// для генерации файла разметки на основе шаблона
const HTMLWebpackPlugin = require('html-webpack-plugin')
// для удаления старых версий сборок
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
// для задания явного простого копирования статических файлов из одного каталога в другой
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin')
// для настройки минификации
const TerserWebpackPlugin = require('terser-webpack-plugin')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
// параметр development добавляется в файле package.json в сценариях,
// а пакет cross-env позволяет кроссплатформенно передавать его
// в переменную окружения
const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev
// настройка однократной загрузки разделяемых (общих) зависимостей,
// то есть используемых разными модулями
const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all'
    }
  }

  if (isProd) {
    config.minimizer = [
      new OptimizeCssAssetWebpackPlugin(),
      new TerserWebpackPlugin()
    ]
  }

  return config
}

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`

const cssLoaders = extra => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true
      },
    },
    'css-loader'
  ]

  if (extra) {
    loaders.push(extra)
  }

  return loaders
}
// настройка преобразования из различных новых синтаксисов JS
// в старый синтаксис, который будет гарантированно поддерживаться всеми браузерами;
// proposal - поддержка нового функционала, не внесенного в стандарт
const babelOptions = preset => {
  const opts = {
    presets: [
      '@babel/preset-env'
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties'
    ]
  }

  if (preset) {
    opts.presets.push(preset)
  }

  return opts
}


const jsLoaders = () => {
  const loaders = [{
    loader: 'babel-loader',
    options: babelOptions()
  }]

  if (isDev) {
    loaders.push('eslint-loader')
  }

  return loaders
}

const plugins = () => {
  const base = [
    // файл разметки генерировать на основе пользовательского шаблона index.html,
    // минифицировать его содержимое, если в командной строке указан параметр
    // для промышленной сборки
    new HTMLWebpackPlugin({
      template: './index.html',
      minify: {
        collapseWhitespace: isProd
      }
    }),
    // удалять старые файлы сборок
    new CleanWebpackPlugin(),
    // копировать графический файл для вкладки браузера
    // из каталога исходных файлов в каталог сборки
    new CopyWebpackPlugin({
      patterns: [
        {
          // образование абсолютных путей
          from: path.resolve(__dirname, 'src/favicon.ico'),
          to: path.resolve(__dirname, 'dist')
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: filename('css')
    })
  ]

  if (isProd) {
    base.push(new BundleAnalyzerPlugin())
  }

  return base
}

module.exports = {
  // каталог исходных кодов
  context: path.resolve(__dirname, 'src'),
  // параметр режима сборки по умолчанию
  mode: 'development',
  // сборка исходных кодов в два результирующих модуля -
  // main... и analytics...
  entry: {
    main: ['@babel/polyfill', './index.jsx'],
    analytics: './analytics.ts'
  },
  // каталог и расширения файлов собранных модулей
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  // при импортах подразумевать, что подключается файл
  // с одним из перечисенных расширений
  resolve: {
    extensions: ['.js', '.json', '.png'],
    // псевдонимы - краткие пути к подкаталогам исходных кодов
    alias: {
      '@models': path.resolve(__dirname, 'src/models'),
      '@': path.resolve(__dirname, 'src'),
    }
  },
  optimization: optimization(),
  // порт сервера разработки - 4200,
  // выходные файлы создаются не в директории dist,
  // а в оперативной памяти
  devServer: {
    port: 4200,
    hot: isDev
  },
  // в режиме разработки гененрировать карты исходных кодов,
  // чтобы в отладчике браузера отображались данные из исходных кодов
  devtool: isDev ? 'source-map' : false,
  plugins: plugins(),
  module: {
    // сопоставления расширений файлов и активации соответствующих загрузчиков
    rules: [
      {
        test: /\.css$/,
        use: cssLoaders()
      },
      {
        test: /\.less$/,
        use: cssLoaders('less-loader')
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoaders('sass-loader')
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: ['file-loader']
      },
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        use: ['file-loader']
      },
      {
        test: /\.xml$/,
        use: ['xml-loader']
      },
      {
        test: /\.csv$/,
        use: ['csv-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: jsLoaders()
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-typescript')
        }
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-react')
        }
      }
    ]
  }
}
