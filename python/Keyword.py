#-*- coding:utf-8 -*-

from konlpy.tag import Mecab
import operator
import math
import sys

# mecab=Mecab()
mecab = Mecab("/app/.linuxbrew/lib/mecab/dic/mecab-ko-dic")

def AnalyzeText(loc,title):
    f=open(loc,"r",encoding='utf-8')
    lines=f.readlines()

    #임시
    parentNode = loc[1:].split("/")
    parentNode.pop()
    dest = "/"+"/".join(parentNode)
    h=open(dest+'/sentence.txt',"w")
    # h=open('./Text/sentence.txt',"w")

    analyze_res=[]

    text = ""

    main_keyword=[]
    for l in lines:
        # 자체 키워드 추출
        if '주제어' in l or '중요 개념' in l or 'Key Words' in l:
            keywords=Keyword_Keyword(l)
            for i in keywords:
                if i not in main_keyword:
                    main_keyword.append(i)
        text += l[:-1]
        h.write(str(l) + '\n')


    temp=text.split('. ')



    for j in temp:
        # print(j)
        if title in j:  #제목 제거
            same=False
            temp_title=title[:min(10,len(title))]
            for text_index in range(len(j)):
                counter=0
                while True:
                    if j[text_index+counter]==temp_title[counter]:
                        counter+=1
                    else: break
                    if counter==5:
                        same=True
                        break
                if same==True:
                    j=j[:text_index]+j[text_index+len(title)-1:]
                    break
        if j!="":
            try:
                a=mecab.pos(j)
                analyze_res.append(a)
                h.write(str(a))
            except: pass
    h.write('\n')

                #print (a)
    h.close()
    # 이 시점 analyze_res=문장이 원소인 List

    result=[]

    # g=open("./Text/temp_sentence.txt",'w')

    # and analyze_res[i][j][0] not in ['을','를','와','가','의','는','인','과','때','즉','할','수','것','연구','하였다','해','로','하는','하여','사용','값','있다','했다','한다','여러','of','and','for','was','is','the','to','than','in']
    for i in range(len(analyze_res)):
        temp=[]
        for j in range(len(analyze_res[i])):
            type=analyze_res[i][j][1].split('+')
            for k in type:
                if k in ['NNG','NNP','NNB','NR','NP','VV','VA','SW','SL','SN','XSN','MM','EC','NNBC','XPN'] and analyze_res[i][j][0].lower() not in ['있','사용','실험','때','연구','우리','이용','이용한','확인','결과','번째','번','년','문제','정의','므로','그림','사진','동안','처리','방법','각자','자신','여','같','통해','한다','하나','of','and','for','was','is','the','to','than','in','fig','self','then','by','this','as','let','we','which','wiki','kr','with','that','on','org','https','has','it']:
                    temp.append((analyze_res[i][j][0],analyze_res[i][j][1]))

                    #화학식, 즉 'Alpha'-'Number'
                    if temp[-1][1]=='SN' and len(temp)!=1 and temp[-2][1]=='SL':
                        # print(1)
                        temp.append((temp[-2][0]+temp[-1][0],'SN'))
                        temp.pop(-3)
                        temp.pop(-2)

                    #3D 등 'Number'-'Alpha'
                    elif temp[-1][1]=='SL' and len(temp)!=1 and temp[-2][1]=='SN':
                        # print(2)
                        # print(temp[len(temp) - 2:len(temp)])
                        temp.append((temp[-2][0] + temp[-1][0], 'SL'))
                        temp.pop(-3)
                        temp.pop(-2)
                    break

            #일부 예외 어절들  ex)('-')
            if analyze_res[i][j][0] in ['-','_'] and len(temp)!=0:
                temp.append((temp[-1][0]+analyze_res[i][j][0],'SN'))
                temp.pop(-2)

            if j!=0 and analyze_res[i][j][0]=='로' and analyze_res[i][j-1][0]=='마이크':
                temp.pop()
                temp.append(('마이크로','NNG'))

            if (analyze_res[i][j][0] in ['넓','길']) and j!=len(analyze_res[i])-1:
                if analyze_res[i][j+1][0]=='이':
                    if len(temp)!=0 and temp[-1][0] in ['넓','길']: temp.pop()
                    temp.append((analyze_res[i][j][0]+analyze_res[i][j+1][0],'NNG'))
            if analyze_res[i][j][0]=='&' and len(temp)!=0:
                temp.append((temp[-1][0]+analyze_res[i][j][0],'SN'))
                temp.pop(-2)


        temp2=[]
        if temp!=[]:
            for i in temp:
                temp2.append(i[0])
            result.append(temp2)
            # g.write(str(temp2)+'\n')

    #for i in result:
        #print(i)

    f.close()
    # g.close()
    return main_keyword,result

def PMI(sentences):
    def FindIn(word, freq):
        for w in freq:
            if w.lower() == word.lower():
                return w, True
        return word, False

    freq={}
    inter_freq={}
    pmi={}
    sentence_num=len(sentences)
    counter=0
    for sentence in sentences:
        #if 'f' in sentence and '1' in sentence:print(sentence)

        for i in range(len(sentence)):
            word=sentence[i]
            word, wordINfreq = FindIn(word, freq)
            if not wordINfreq:
                freq[word]=1/sentence_num
            else:
                freq[word]+=1/sentence_num
            ########################
            j=i+1
            if j==len(sentence): continue
            temp=(sentence[i],sentence[j])
            #temp2=(sentence[j],sentence[i])
            if temp in inter_freq:
                inter_freq[temp]+=1/sentence_num
            #elif temp2 in inter_freq:
                #inter_freq[temp2]+=1/sentence_num
            else:
                inter_freq[temp]=1/sentence_num

    for i in inter_freq.keys():
        word1=i[0]
        word2=i[1]
        #print(word1,word2,pmi[i])
        pmi[i]=math.log(inter_freq[i] / freq[FindIn(word1,freq)[0]] / freq[FindIn(word2,freq)[0]])

    sorted_pmi=sorted(pmi.items(),key=operator.itemgetter(1))
    sorted_pmi.reverse()

    #counter=0
    #for i in range(len(sorted_dic)):
        #if sorted_dic[i][1]<=3/sentence_num:
            #counter=i
            #break
    #sorted_dic=sorted_dic[:i]

    #len_pmi=len(sorted_pmi)
    #sorted_pmi=sorted_pmi[:int(len_pmi/10)]

    #for i in sorted_dic:
        #print(i)
    #for i in sorted_pmi:
        #print(i)

    return freq,sorted_pmi,inter_freq

def ExtractKeyword(frequency,pmi,inter_freq,text="./Text/result_All.txt"):
    result=[]
    for i in pmi:
        if (i[0][0],i[0][1]) in inter_freq.keys():
            #if i[0][0]=='f': print (i,inter_freq[(i[0][0],i[0][1])])
            value=i[1]*(inter_freq[(i[0][0],i[0][1])])
        #else:
            #if i[0][1]=='f': print (inter_freq[(i[0][1],i[0][0])])
            #value=i[1]*(inter_freq[(i[0][1],i[0][0])])*0.9
        #value=i[1]*(frequency[i[0][0]]+frequency[i[0][1]])/2*0.7
        result.append([i[0][0],i[0][1],value])

    for i in frequency.keys():
        if len(i)!=1:
            result.append([i,frequency[i]])

    new_res=sorted(result, key=lambda word_pair: word_pair[-1])
    new_res.reverse()

    keyword=new_res[:20] #앞에서 n개만큼 추출
    keyword2=keyword[:]
    # for i in keyword:
    #     print(i)
    # print('################')
    ##############################################
    def MergeWords(word):
        counter=0
        for i in keyword:
            temp=''
            # print(i,word)
            if i[0]==word[-2] and i[-2]!=word[-2]:
                temp=word[0:len(word)-1]+i[1:len(i)-1]+[(word[-1]+i[-1])]
                if i in keyword:
                    keyword.pop(keyword.index(i))
                counter=1
                break
        if counter==1:
            #print (temp)
            #print(1)
            return MergeWords(temp)
        else:
            return word
    #############################################
    for i in keyword:
        for j in range(len(keyword2)-1,-1,-1):
            if i[-2]==keyword2[j][0]:
                if len(i)!=2:
                    keyword2.pop(j)
            elif len(keyword2[j])==2:
                keyword2.pop(j)
    for i in keyword2:
        mergedword=MergeWords(i)
        if mergedword not in keyword:
            keyword.pop(keyword.index(i))
            mergedword[-1]/=len(mergedword)-2
            keyword.append(mergedword)

    for i in range(len(keyword)):
        temp=''
        for j in range(len(keyword[i])-1):
            temp+=keyword[i][j]
        if temp[-1]=='-':
            temp=temp[:-1]
        keyword[i]=[temp,keyword[i][-1]]
    for i in range(len(keyword)-1,-1,-1):
        counter=0
        for j in range(len(keyword)):
            if keyword[i][0] in keyword[j][0] and i!=j:
                keyword.pop(i)
                break
    keyword=sorted(keyword, key=lambda word_pair: word_pair[-1])
    keyword.reverse()
    # for i in keyword:
    #     print(i)

    return keyword

def RemoveName(name_list,keyword):
    if name_list==['']: return keyword
    for i in name_list:
        for j in range(len(keyword)-1,-1,-1):
            if i in keyword[j][0]:
                keyword.pop(j)
    return keyword

def Keyword_Keyword(keyword_line):
    temp=keyword_line.split(':')
    if len(temp)!=1:
        a=temp[1]
    else: a=''
    b=a.split(',')
    for i in range(len(b)):
        if len(b[i])==0: continue
        if b[i][0]==' ':
            b[i]=b[i][1:]
        if b[i][-1]==' ' or b[i][-1]=='\n':
            b[i]=b[i][:-1]
        c=b[i].split(' ')
        b[i]=''
        for j in c:
            b[i]+=j
    return b

def RankKeyword(title_keyword,main_keyword,keyword):
    rank_sum=0
    for i in range(len(keyword)-1,-1,-1):
        if len(keyword[i][0])>=15:
            keyword.pop(i)
        else:
            rank_sum+=keyword[i][1]
    for i in keyword:
        i[1]/=rank_sum
    max_weight = keyword[0][1]
    for i in range(len(keyword)):
        if keyword[i][1] < 0.6 * max_weight:
            keyword = keyword[:max(5,i)]
            break
    temp=[]
    for i in title_keyword:
        for j in keyword:
            if i[0]==j[0]:
                temp.append(i)
    for i in temp:
        for j in keyword:
            if i[0]==j[0]:
                j[1]+=1/len(temp)

    for i in main_keyword:
        counter = 0
        for j in keyword:
            if i==j[0]:
                j[1]+=1/len(main_keyword)
                counter=1
                break
        if counter==0:
            keyword.append([i,1/len(main_keyword)])

    if temp==[]:
        for i in range(len(keyword)):
            keyword[i][1]+=1/len(keyword)
    keyword = sorted(keyword, key=lambda word_pair: word_pair[-1])
    keyword.reverse()

    # sum=0
    for i in range(len(keyword)):
        if main_keyword==[]:
            keyword[i][1]*=1.5
        # sum+=keyword[i][1]
        #print(keyword[i])
    # print(sum)

    return keyword

def ExtractTitle(title):
    a=mecab.pos(title)
    temp=[]
    for i in a:
        type=i[1].split('+')
        for k in type:
            if k in ['NNG','NNP','NNB','NR','NP','VV','VA','SW','SL','SN','XSN','MM','EC','NNBC','XPN'] and i[0].lower() not in ['있','사용','실험','때','연구','우리','이용','이용한','확인','결과','번째','번','년','문제','정의','므로','그림','사진','동안','처리','방법','각자','자신','여','같','통해','한다','하나','of','and','for','was','is','the','to','than','in','fig','sel        f','then','by','this','as','let','we','which','wiki','kr','with','that','on','org','https','has','it']:
                temp.append(i)
                break
    return temp

def SimilarKeyword(keyword):
    old_keyword=[]
    for i in range(len(keyword)):
        for j in range(len(keyword)):
            if i==j or len(keyword[j])>len(keyword[i]): continue
            word1,word2=keyword[i][0],keyword[j][0]
            pointer1,pointer2=0,0
            counter=0
            while True:
                if counter>1: break
                if pointer1==len(word1):
                    if pointer2==len(word2):
                        break
                    counter+=1
                    pointer2+=1
                elif pointer2==len(word2):
                    if pointer1==len(word1):
                        break
                    counter+=1
                    pointer1+=1
                elif word1[pointer1]==word2[pointer2]:
                    pointer1+=1
                    pointer2+=1
                elif word1[pointer1]!=word2[pointer2]:
                    counter+=1
                    pointer1+=1
            if counter>1: continue
            else:
                analyze=mecab.pos(word1)
                temp_word=word2
                difference=[]
                #1글자 차이나는 일부 키워드들 융합
                for k in range(len(word1)):
                    # print(word1,word2,word1[k],temp_word)
                    if len(temp_word)!=0 and temp_word[0]==word1[k]:
                        temp_word=temp_word[1:]
                    else:
                        difference.append(word1[k])
                for k in analyze:
                    if len(difference)!=0 and k[0]==difference[0] and k[1][0]=='J':
                        old_keyword+=keyword[j]
                        keyword[i][1]+=keyword[j][1]
    for i in range(len(keyword)-1,-1,-1):
        if keyword[i] in old_keyword:
            keyword.pop(i)
    return keyword


def main(names,title,directory):
    name_list=names  #['A','B','C']등의 List
    main_keyword,text1=AnalyzeText(directory,title) #"./Text/temp.txt"등의 string
    title_keyword=ExtractTitle(title)
    freq,pmi,inter_freq=PMI(text1)
    keyword=ExtractKeyword(freq,pmi,inter_freq,"./Text/result_All.txt")
    # print('####################################')
    keyword=RemoveName(name_list,keyword)
    keyword=RankKeyword(title_keyword,main_keyword,keyword)
    keyword=SimilarKeyword(keyword)
    for i in keyword:
        print(i[0]+":"+str(int(i[1]*10000)))

main(sys.argv[1],sys.argv[2],sys.argv[3])
# main( [ '류수현','박지호','정세화' ],'데이터의 행렬화를 이용한 효육적인 추천','./Text/temp.txt' )
