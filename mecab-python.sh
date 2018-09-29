echo "dicdir=/app/.linuxbrew/lib/mecab/dic/mecab-ko-dic" > /app/.linuxbrew/etc/mecabrc

# install mecab-python
cd /tmp
git clone https://bitbucket.org/eunjeon/mecab-python-0.996.git
cd mecab-python-0.996
> setup.py

cat <<EOT >> setup.py
#!/usr/bin/env python

from distutils.core import setup,Extension,os
import string

def cmd1(str):
    return os.popen(str).readlines()[0][:-1]

def cmd2(str):
    return cmd1(str).split()

setup(name = "mecab-python",
	version = "0.996/ko-0.9.0",
	py_modules=["MeCab"],
	ext_modules = [
		Extension("_MeCab",
			["MeCab_wrap.cxx",],
			include_dirs="/app/.linuxbrew/Cellar/mecab-ko/0.996-ko-0.9.2/include".split(),
			library_dirs="/app/.linuxbrew/Cellar/mecab-ko/0.996-ko-0.9.2/lib".split(),
			libraries="mecab stdc++".split())
	])
EOT

python setup.py build
python setup.py install

if hash "python3" &>/dev/null
then
    python3 setup.py build
    python3 setup.py install
fi
