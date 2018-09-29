# install mecab-python
cd /tmp
apt-get install libmecab-config
git clone https://bitbucket.org/eunjeon/mecab-python-0.996.git
cd mecab-python-0.996

python setup.py build
python setup.py install

if hash "python3" &>/dev/null
then
    python3 setup.py build
    python3 setup.py install
fi
