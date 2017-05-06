package contact

import (
	telegram "gopkg.in/telegram-bot-api.v4"
	"strings"
)

type TelegramBotCallback func(telegram.Update, *telegram.BotAPI, []string) bool

type TelegramBot struct {
	Tocken     string
	Commands   map[string]TelegramBotCallback
	Bot        *telegram.BotAPI
	UpdateChan <-chan telegram.Update
}

func NewTelegramBot(tocken string) *TelegramBot {
	tb := new(TelegramBot)

	// Setup bot with API tocken
	var err error
	tb.Tocken = tocken
	tb.Bot, err = telegram.NewBotAPI(tocken)
	//tb.Bot.Debug = true

	// Initialize memory for map
	tb.Commands = make(map[string]TelegramBotCallback)

	if err != nil {
		panic(err)
	}

	return tb
}

func (tb *TelegramBot) DefineCommand(command string, callback TelegramBotCallback) {
	if _, ok := tb.Commands[command]; ok {
		panic("Telegram bot command '" + command + "' already defined")
	}

	tb.Commands[command] = callback
}

func (tb *TelegramBot) Listen() {
	// Settings for the update retrieval
	u := telegram.NewUpdate(0)
	u.Timeout = 60

	// Apply setting to the bot
	var err error
	tb.UpdateChan, err = tb.Bot.GetUpdatesChan(u)
	if err != nil {
		panic(err)
	}

	// Run endless loop in another thread
	go tb.listenLoop()
}

func (tb *TelegramBot) listenLoop() {
	// Run endless loop to poll for updates
	for update := range tb.UpdateChan {
		if update.Message == nil {
			continue
		}

		// Check if the message contains a command
		text := update.Message.Text
		if text[0] == '/' {
			// The message is a command, now get the command and arguments
			tockens := strings.Split(text, " ")
			commandName := tockens[0][1:]

			if callback, ok := tb.Commands[commandName]; ok {
				callback(update, tb.Bot, tockens[1:])
			} else {
				// An unknown command was sent, reply with an error message
				msg := telegram.NewMessage(update.Message.Chat.ID, "Unrecognized command. A typo?")
				tb.Bot.Send(msg)
			}
		} else {
			// For now ignore non-command messages
		}
	}
}
