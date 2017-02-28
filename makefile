SRC=src/
OUT=Patchouli.user.js

all:first meta misc main css
	firefox $(OUT)
first:
	printf '' > $(OUT)
meta:
	cat $(SRC)userscript.metadata.js >> $(OUT)
misc:
	cat $(SRC)utils.js >> $(OUT)
	printf '\n' >>  $(OUT)
main:
	cat $(SRC)koakuma.vue2.js >> $(OUT)
	printf '\n' >> $(OUT)
	cat $(SRC)patchouli.vue2.js >> $(OUT)
	printf '\n' >> $(OUT)
	cat $(SRC)main.js >> $(OUT)
	printf '\n' >> $(OUT)
css:
	echo 'utils.addStyle(`' >> $(OUT)
	cat $(SRC)style.css >> $(OUT)
	echo '`);' >> $(OUT)
clean:
	rm $(OUT)
