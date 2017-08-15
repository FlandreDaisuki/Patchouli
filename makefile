SRC = src/
TARGET = Patchouli.user.js
DEVNAME = Patchouli.dev.user.js

all:
	make release
	make debug

release: base
	sed -i s/\.dev//g $(TARGET)
	sed -i '/console.debug/d' $(TARGET)

debug: before-debug base
	cat $(SRC)debug.js >> $(TARGET)
	sed -i s/\.min\.js/.js/g $(TARGET)

before-debug:
	$(eval TARGET=$(DEVNAME))

base:
	cp $(SRC)meta.js $(TARGET)
	sed -i "s/DATEVERSION/$$(date +%Y.%m.%d)/g" $(TARGET)

	cat $(SRC)utils/*.js >> $(TARGET)

	# global depend on utils
	cat $(SRC)global.js >> $(TARGET)

	# vue-components depend on utils global
	cat $(SRC)vue-components/*.js >> $(TARGET)

	# main.js depend on all above
	cat $(SRC)main.js >> $(TARGET)