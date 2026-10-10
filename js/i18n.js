/*
 * Words used by the buttons and labels, in English, Spanish and Russian.
 * The presentation itself is translated in content.js.
 */
(function () {
  "use strict";

  var UI = {
    en: {
      title: "Who Holds the Strings?",
      subtitle: "Leaders and Manipulators",
      addFiles: "+ Add files",
      fullscreen: "Full screen",
      settings: "Settings",
      hint: "Swipe to turn the folders · Tap the front folder to open it",
      open: "Open “{x}”",
      back: "Back",
      next: "Next",
      close: "Close",
      pageOf: "Page {n} of {m}",
      playVideo: "Play video",
      openFull: "Open full screen",
      showAnswer: "Show answer",
      hideAnswer: "Hide answer",
      language: "Language",
      appearance: "Appearance",
      day: "Day",
      night: "Night",
      auto: "Auto",
      autoNote: "Auto: Day from 7:00 to 19:00, Night the rest of the time.",
      brightness: "Brightness",
      file: "FOLDER",
      inThisFile: "In this folder",
      question: "Question {n}",
      quizPrompt: "What do you think? Then press “Show answer”.",
      leader: "Leader",
      manipulator: "Manipulator",
      hintVideo: "Press “Play video” to watch.",
      hintOpen: "Press “Open full screen” to show it.",
      drop: "Drop videos, PDFs or pictures here",
      onlyMedia: "Only videos (.mp4), PDFs and pictures can be added.",
      addedTitle: "Added Files",
      addedSub: "Shared today",
      no3d: "This screen can’t show 3-D graphics. Please open this page in Chrome or Edge.",
      opening: "Opening…",
      videoError: "This video could not be played. Check that the file is in the media folder and is an .mp4 file.",
      fileError: "Could not open this file."
    },
    es: {
      title: "¿Quién mueve los hilos?",
      subtitle: "Líderes y manipuladores",
      addFiles: "+ Añadir archivos",
      fullscreen: "Pantalla completa",
      settings: "Ajustes",
      hint: "Desliza para girar las carpetas · Toca la carpeta del frente para abrirla",
      open: "Abrir «{x}»",
      back: "Atrás",
      next: "Siguiente",
      close: "Cerrar",
      pageOf: "Página {n} de {m}",
      playVideo: "Ver el video",
      openFull: "Abrir en pantalla completa",
      showAnswer: "Ver respuesta",
      hideAnswer: "Ocultar respuesta",
      language: "Idioma",
      appearance: "Apariencia",
      day: "Día",
      night: "Noche",
      auto: "Auto",
      autoNote: "Auto: Día de 7:00 a 19:00, Noche el resto del tiempo.",
      brightness: "Brillo",
      file: "CARPETA",
      inThisFile: "En esta carpeta",
      question: "Pregunta {n}",
      quizPrompt: "¿Tú qué piensas? Luego pulsa «Ver respuesta».",
      leader: "Líder",
      manipulator: "Manipulador",
      hintVideo: "Pulsa «Ver el video» para verlo.",
      hintOpen: "Pulsa «Abrir en pantalla completa» para verlo.",
      drop: "Suelta aquí videos, PDF o imágenes",
      onlyMedia: "Solo se pueden añadir videos (.mp4), PDF e imágenes.",
      addedTitle: "Archivos añadidos",
      addedSub: "Compartidos hoy",
      no3d: "Esta pantalla no puede mostrar gráficos 3D. Abre esta página en Chrome o Edge.",
      opening: "Abriendo…",
      videoError: "No se pudo reproducir este video. Comprueba que el archivo está en la carpeta media y que es un archivo .mp4.",
      fileError: "No se pudo abrir este archivo."
    },
    ru: {
      title: "Кто дёргает за ниточки?",
      subtitle: "Лидеры и манипуляторы",
      addFiles: "+ Добавить файлы",
      fullscreen: "Во весь экран",
      settings: "Настройки",
      hint: "Проведи пальцем, чтобы повернуть папки · Нажми на переднюю папку, чтобы открыть её",
      open: "Открыть «{x}»",
      back: "Назад",
      next: "Далее",
      close: "Закрыть",
      pageOf: "Страница {n} из {m}",
      playVideo: "Смотреть видео",
      openFull: "Открыть на весь экран",
      showAnswer: "Показать ответ",
      hideAnswer: "Скрыть ответ",
      language: "Язык",
      appearance: "Оформление",
      day: "День",
      night: "Ночь",
      auto: "Авто",
      autoNote: "Авто: днём с 7:00 до 19:00 — светлая тема, в остальное время — тёмная.",
      brightness: "Яркость",
      file: "ПАПКА",
      inThisFile: "В этой папке",
      question: "Вопрос {n}",
      quizPrompt: "Как ты думаешь? Потом нажми «Показать ответ».",
      leader: "Лидер",
      manipulator: "Манипулятор",
      hintVideo: "Нажми «Смотреть видео», чтобы посмотреть.",
      hintOpen: "Нажми «Открыть на весь экран», чтобы показать.",
      drop: "Перетащите сюда видео, PDF или картинки",
      onlyMedia: "Можно добавить только видео (.mp4), PDF и картинки.",
      addedTitle: "Добавленные файлы",
      addedSub: "Добавлены сегодня",
      no3d: "Этот экран не может показывать 3D-графику. Откройте эту страницу в Chrome или Edge.",
      opening: "Открываем…",
      videoError: "Не удалось воспроизвести это видео. Проверьте, что файл лежит в папке media и имеет формат .mp4.",
      fileError: "Не удалось открыть этот файл."
    }
  };

  var NAMES = { en: "English", es: "Español", ru: "Русский" };

  var I18N = {
    lang: "en",
    names: NAMES,
    langs: ["en", "es", "ru"],

    // A UI word: t("pageOf", { n: 1, m: 3 })
    t: function (key, vars) {
      var s = (UI[I18N.lang] && UI[I18N.lang][key]) || UI.en[key] || key;
      if (vars) for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
      return s;
    },

    // A piece of content: either plain text, or { en: "...", es: "...", ru: "..." }
    T: function (v) {
      if (v == null) return "";
      if (typeof v === "string") return v;
      return v[I18N.lang] || v.en || "";
    },

    // "3 pages" with the right grammar in each language
    pages: function (n) {
      if (I18N.lang === "es") return n + (n === 1 ? " página" : " páginas");
      if (I18N.lang === "ru") {
        var m10 = n % 10, m100 = n % 100;
        var w = (m10 === 1 && m100 !== 11) ? "страница"
          : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? "страницы"
          : "страниц";
        return n + " " + w;
      }
      return n + (n === 1 ? " page" : " pages");
    }
  };

  window.I18N = I18N;
})();
