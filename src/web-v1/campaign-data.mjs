// STORY-02 definitions are copied into each new life. Saved names stay authoritative.
const option=(label,months=0,cost=0,effects={},extra={})=>({label,months,cost,effects,...extra});
const scene=(title,speaker,text,choices,extra={})=>({title,speaker,text,choices,...extra});
const variants=(training,work,bond)=>[...Object.entries({training,work,bond})].map(([id,[text,choice]])=>({id,text,choice}));
export const CAMPAIGN_STAGES=['입문과 첫 약속','문파에서 맡은 일','강호에서 맺은 인연','갈등에 대비','해결과 결말'];
export const CAMPAIGN_RESOURCES={support:'협력',information:'확인한 정보',supplies:'준비 물자',standing:'맡은 책임'};
const hs01={id:'C-HS-01',origin:'P-HUASHAN',title:'산문 아래의 약속',summary:'사문의 짐을 옮길 길과 주민이 피난할 길이 겹쳤습니다. 누구의 안전을 먼저 약속할지 결정합니다.',role:'길목의 보호자',enemyKey:'campaign-hs01',
 npcs:[{id:'master',name:'선택한 사부',role:'화산의 사부',symbol:'梅'},{id:'peer',name:'진소',role:'수송을 맡은 동문',symbol:'劍'},{id:'resident',name:'연아',role:'길목 주민의 대표',symbol:'家'}],
 enemy:{id:'E-CAMPAIGN-HS01',name:'산문 길목의 봉쇄자',realm:1,mastery:35,style:'중',mode:'duel',faction:'F-NORMAL',cost:7,foundation:{inner:30000,outer:30000}},
 scenes:[
 scene('무엇을 지키는 검인가','master','사부가 산문 아래에서 온 빈 약함을 보여 줍니다. 짐의 수량과 사람의 사정을 함께 살피라는 첫 부탁입니다.',[
  option('주민의 귀환까지 맡겠다고 약속한다',0,0,{support:1},{flag:'residents',relation:['resident',1]}),option('수송 명부의 정확성을 맡는다',0,0,{information:1},{flag:'ledger',relation:['peer',1]})]),
 scene('배운 검을 어느 자리에 쓸까','master','후속 검법을 익혔습니다. 사부는 검의 이름보다 그 검을 꺼낼 때를 묻습니다.',[
  option('길을 막는 위협부터 가려낸다',0,0,{information:1},{flag:'restraint'}),option('짐을 옮기는 동문과 대형을 맞춘다',1,0,{support:1},{relation:['peer',1]})],{gate:'learning'}),
 scene('첫 비무 뒤의 부탁','peer','진소는 비무의 승패보다 오래 버티는 자세를 눈여겨봤습니다. 수송대를 이끌 때도 같은 약점을 드러낼지 함께 점검하자고 합니다.',[
  option('피로한 구간을 솔직히 나눈다',0,0,{support:1},{flag:'shared-weakness',relation:['peer',1]}),option('호흡의 흐름을 따로 기록한다',1,0,{information:1},{flag:'breath-notes'})],{gate:'practice'}),
 scene('빈 약함의 주인','resident','약함을 돌려주러 온 연아는 다음 수송까지 기다릴 수 없는 집이 있다고 말합니다. 서두를지 실제 수량부터 볼지 정합니다.',[
  option('이웃의 약함을 함께 조사한다',1,0,{information:1},{flag:'household-list'}),option('비상 약함을 사서 먼저 보낸다',0,10,{supplies:1},{relation:['resident',1]})],{variants:variants(
   ['비무에서 확인한 지구력으로 급한 집부터 직접 돌 수 있습니다.',option('쉬어 갈 지점을 정해 약을 나른다',1,0,{support:1,information:1},{flag:'rest-stops'})],
   ['마친 일거리의 수송 기록에 약함이 빠진 구간이 남아 있습니다.',option('완료한 운송 기록과 약함을 대조한다',0,0,{information:2},{flag:'missing-crate'})],
   ['앞서 주민을 맡겠다는 약속을 들은 이웃들이 이름을 내놓습니다.',option('동의를 받은 집만 묶어 도움을 청한다',0,0,{support:2},{flag:'consent-list',relation:['resident',1]})])}),
 scene('산문에 남길 약속','master','사부는 모든 짐을 동시에 지킬 수 없다고 일러 줍니다. 첫 책임의 범위를 동문과 주민 앞에서 분명히 해야 합니다.',[
  option('피난로를 먼저 열겠다고 알린다',0,0,{standing:1},{flag:'evacuation-first'}),option('약과 식량의 전달을 우선한다',0,0,{supplies:1},{flag:'supply-first'})]),
 scene('첫 일거리의 빈칸','peer','강호의 일을 끝내고 돌아오니 명부와 실제 도착 시간이 다릅니다. 진소는 지연된 짐을 네 책임으로 돌릴까 망설입니다.',[
  option('완료 기록을 함께 검토한다',0,0,{information:1},{relation:['peer',1],flag:'joint-audit'}),option('내 담당 구간부터 다시 걷는다',1,0,{standing:1},{flag:'own-survey'})],{gate:'work'}),
 scene('비에 끊긴 잔교','resident','작은 다리가 무너져 아이와 노인이 돌아가야 합니다. 수송대의 판자를 쓰면 예정한 짐 일부는 늦어집니다.',[
  option('판자 사용을 동문과 합의한다',1,0,{support:1},{relation:['peer',1],flag:'bridge-agreement'}),option('사비로 임시 판자를 마련한다',0,20,{supplies:2},{flag:'paid-bridge'}),option('다리를 쓰지 않는 샛길을 찾는다',3,0,{information:1},{flag:'footpath'})]),
 scene('누가 지연을 책임질까','peer','상단은 늦은 짐의 책임자를 요구합니다. 진소가 혼자 서류에 이름을 적으려 합니다.',[
  option('함께 결정한 근거를 제출한다',0,0,{standing:1},{requires:{flag:'joint-audit'},relation:['peer',2],flag:'shared-liability'}),option('주민의 통행 시간을 더 조사한다',1,0,{information:1},{flag:'witness-hours'}),option('보관 비용을 대신 지불한다',0,10,{support:1},{relation:['peer',1]})]),
 scene('물자를 나누는 기준','master','산문 창고는 모든 요청을 받아 줄 수 없습니다. 사부는 네가 실제로 확인한 일에 한해서 문을 열겠다고 합니다.',[
  option('약함 기록을 근거로 작은 창고를 연다',0,0,{supplies:2},{requires:{flag:'household-list'},flag:'medicine-cache'}),option('줄어든 물자로 가능한 계획을 다시 짠다',1,0,{information:1},{flag:'lean-plan'})],{variants:variants(
   ['수련 때 몸을 아끼는 법을 익혔습니다. 짐을 나누면 운반 인원을 줄일 수 있습니다.',option('짧은 구간을 이어 나르는 교대를 짠다',1,0,{support:1,supplies:1},{flag:'relay'})],
   ['이전에 마친 일거리의 운임표가 있습니다. 빈 수레를 빌리는 편이 저렴합니다.',option('빈 수레만 따로 빌린다',0,10,{supplies:2},{flag:'empty-cart'})],
   ['앞서 도운 주민들이 각자 빌려줄 도구를 적었습니다.',option('빌린 물품의 반환 약속부터 남긴다',0,0,{support:1,supplies:1},{relation:['resident',1],flag:'borrow-ledger'})])}),
 scene('보호 임무를 받을 것인가','master','사부는 산문 밖의 보호 책임을 제안합니다. 정식 책임을 거절해도 이미 한 약속은 다른 방식으로 마무리할 수 있습니다.',[
  option('보호 임무를 맡고 인계를 받는다',0,0,{standing:2},{flag:'official-duty',relation:['master',1]}),option('정식 임무를 거절하고 주민과 직접 움직인다',1,0,{support:1},{flag:'civil-route',relation:['resident',1]})]),
 scene('같은 길을 쓰는 상단','resident','수송대와 피난민이 같은 좁은 길을 쓰려 합니다. 연아는 누구에게도 위험을 숨기지 말아 달라고 합니다.',[
  option('서로 다른 출발 시각을 협의한다',1,0,{support:1},{flag:'shared-schedule'}),option('화물 보관료를 내고 피난민을 먼저 보낸다',0,20,{supplies:1},{relation:['resident',1],flag:'civilians-first'})]),
 scene('먼저 도착한 소문','peer','산문이 주민을 버렸다는 소문이 퍼졌습니다. 설명을 서두르면 아직 확인하지 못한 약속까지 떠안을 수 있습니다.',[
  option('확인한 일과 미확인 일을 나눠 공개한다',0,0,{information:1},{flag:'public-facts',relation:['resident',1]}),option('진소와 직접 집집마다 설명한다',1,0,{support:2},{relation:['peer',1],flag:'joint-explanation'})]),
 scene('빈자리를 채울 사람','resident','운반을 맡기로 한 한 사람이 돌아오지 않았습니다. 다른 주민을 억지로 부르지 않고 빈자리를 채워야 합니다.',[
  option('일정을 늘리고 직접 빈 구간을 맡는다',3,0,{standing:1},{flag:'self-carry'}),option('품삯을 내고 대체 인력을 구한다',0,20,{supplies:1},{flag:'hired-carrier'}),option('공동 설명에 참여한 동문에게 부탁한다',0,0,{support:1},{requires:{flag:'joint-explanation'},relation:['peer',1],flag:'peer-carrier'})]),
 scene('누구의 지도를 믿을까','resident','두 지도가 서로 다른 안전한 길을 가리킵니다. 종이에 그어진 선을 그대로 사람에게 권할 수는 없습니다.',[
  option('연아와 갈림길을 직접 확인한다',1,0,{information:2},{relation:['resident',1],flag:'verified-route'}),option('우회로 안내인을 고용한다',0,10,{information:1},{flag:'hired-guide'})],{variants:variants(
   ['비무와 수련에서 익힌 거리 판단으로 좁은 길의 교차 지점을 계산할 수 있습니다.',option('멈춰 설 자리까지 지도에 표시한다',1,0,{information:2},{flag:'spacing-map'})],
   ['마친 수송의 통행 시각과 지도상 거리가 맞지 않습니다.',option('지연된 구간의 표식을 대조한다',0,0,{information:2},{flag:'timing-map'})],
   ['주민들이 네 설명을 들은 뒤 서로 다른 목격을 보태고 있습니다.',option('서로 독립된 증언 두 개를 맞춘다',0,0,{information:1,support:1},{flag:'witness-map'})])}),
 scene('지원 요청에 답하다','peer','진소가 산문으로 돌아와 병력을 더 부르자고 합니다. 그동안 길목을 비워 둘지 결정해야 합니다.',[
  option('지금의 협력으로 남아서 길을 지킨다',0,0,{standing:1},{requires:{resource:'support',min:3},flag:'stay-together'}),option('주민에게 위험을 알리고 동행해 이동한다',1,0,{information:1},{flag:'move-together'}),option('연락 인력을 고용해 길목을 유지한다',0,10,{support:1},{flag:'runner'})]),
 scene('몸과 검이 감당할 구간','master','길목 봉쇄자는 무거운 검을 여러 번 밀어붙입니다. 긴 대치에서 몸을 지킬지, 짧은 발동의 기회를 찾을지 준비합니다.',[
  option('수련에서 확인한 거리로 대형을 짠다',1,0,{supplies:1},{flag:'formation'}),option('봉쇄자의 호흡과 교대를 조사한다',1,0,{information:2},{flag:'enemy-breath'})],{gate:'training'}),
 scene('도움에 기대는 방식','peer','동문들은 함께 서겠다고 하지만 모든 위험을 대신 막아 줄 수는 없습니다. 지원의 범위를 합의합니다.',[
  option('피난 인계만 맡기고 검은 직접 든다',0,0,{support:1},{flag:'rear-support',relation:['peer',1]}),option('판자로 엄폐 지점을 보강한다',0,20,{supplies:2},{flag:'cover'}),option('사람을 부르지 않고 우회 시간을 확보한다',3,0,{information:1},{flag:'solo-detour'})]),
 scene('남은 약 한 봉지','resident','미리 마련한 구호품 중 약재를 주민에게 인계하자는 요청입니다. 준비 물자가 없다면 현장에서 마련할 시간이나 비용이 필요합니다.',[
  option('준비한 구호품 한 몫을 주민에게 인계한다',0,0,{supplies:-1,support:2},{requires:{resource:'supplies',min:1},relation:['resident',1],flag:'civil-medicine'}),option('직접 약초와 붕대를 모아 구호품을 마련한다',3,0,{supplies:1},{flag:'gathered-medicine'}),option('의술로 지금 필요한 약재만 가려 마련한다',1,0,{supplies:1},{requires:{assist:'medicine'},flag:'sorted-medicine'})]),
 scene('바람 앞의 신호','peer','흙먼지가 일면 약속한 손짓을 알아보기 어렵습니다. 실제로 수행한 준비를 신호 체계로 바꿔야 합니다.',[
  option('서로 보이는 자리에서 한 번씩 확인한다',1,0,{support:1},{flag:'tested-signals'}),option('신호 도구를 사서 짧게 훈련한다',1,10,{supplies:2},{flag:'signal-tools'})],{variants:variants(
   ['외공과 내공을 나눠 수련한 기록에 각자의 교대 한계가 보입니다.',option('힘이 떨어지기 전 교대 신호를 정한다',0,0,{support:1,information:1},{flag:'early-relief'})],
   ['완료한 일거리의 인계 절차는 말이 닿지 않을 때도 사용됐습니다.',option('수송 인계 표식을 피난 신호로 바꾼다',0,0,{supplies:1,information:1},{flag:'handover-signals'})],
   ['도움을 약속한 주민이 가장 잘 보이는 지점을 알려 줍니다.',option('주민과 동문이 같은 신호를 재확인한다',0,0,{support:2},{flag:'shared-signals'})])}),
 scene('발견한 위험을 밝힐까','master','확인한 정보가 부족하면 결전을 준비했다고 말할 수 없습니다. 사부에게 준비의 빈틈을 어떻게 알릴지 정합니다.',[
  option('모르는 구간을 밝히고 하루 더 살핀다',1,0,{information:1},{relation:['master',1],flag:'honest-gap'}),option('확인한 지도에 따라 지원을 요청한다',0,0,{support:2},{requires:{resource:'information',min:5},flag:'informed-support'})]),
 scene('첫 무리의 통과','resident','주민의 첫 무리가 길목에 섰습니다. 앞서 세운 우선순위를 지금의 행동으로 보여 줘야 합니다.',[
  option('피난 약속대로 주민부터 보낸다',1,0,{standing:1},{requires:{flag:'evacuation-first'},relation:['resident',1],flag:'evacuated'}),option('약을 인계한 뒤 한 무리씩 동행한다',3,0,{standing:1},{flag:'escorted-through'}),option('준비 물자로 두 이동로를 분리한다',1,0,{standing:1},{requires:{resource:'supplies',min:4},flag:'two-routes'})]),
 scene('남겨진 짐과 약속','peer','마지막 수레가 멈췄습니다. 진소는 짐 때문에 주민을 되돌려 부르지 않겠다고 말합니다.',[
  option('물품 명부만 확보하고 수레를 비운다',0,0,{information:1},{flag:'cargo-record',relation:['peer',1]}),option('수레 수리비를 내고 남은 짐을 맡는다',1,20,{standing:1},{flag:'cargo-saved'})]),
 scene('책임을 나누는 마지막 확인','master','사부는 누구에게 무엇을 부탁했는지 다시 묻습니다. 위험을 남에게 떠넘긴 약속으로 끝내지 않아야 합니다.',[
  option('검은 직접 맡고 주민 인계는 협력자에게 맡긴다',0,0,{support:1},{requires:{resource:'support',min:4},flag:'shared-final'}),option('인원을 줄여 마지막 길을 직접 확인한다',3,0,{information:1},{flag:'self-final'})]),
 scene('봉쇄를 끝낼 방법','peer','봉쇄자는 사람 대신 짐의 통행권을 내놓으라고 요구합니다. 쌓아 온 정보와 협력으로 대응하거나 직접 검을 겨룰 수 있습니다.',[
  option('확인한 통행 기록으로 요구를 반박한다',1,0,{standing:1},{requires:{resource:'information',min:5},flag:'exposed-demand'}),option('검을 겨뤄 길을 연다',1,0,{standing:2},{battle:true,flag:'opened-by-sword'}),option('길목을 버리고 주민과 새 길을 낸다',3,0,{standing:1},{flag:'new-path'})],{variants:variants(
   ['비무에서 익힌 대치 경험으로 봉쇄자의 압박 시점을 구별합니다.',option('대치 경험을 살려 교대를 끊고 겨룬다',1,0,{standing:2},{battle:true,flag:'timed-sword'})],
   ['상단 일을 마친 기록이 봉쇄자의 통행료 주장과 충돌합니다.',option('상단의 납부 기록을 공개해 요구를 무너뜨린다',1,0,{standing:1},{flag:'trade-proof'})],
   ['함께 남은 주민과 동문이 별도의 통과 절차에 동의했습니다.',option('동의를 모은 행렬로 봉쇄 바깥을 통과한다',1,0,{standing:1},{flag:'collective-exit'})])}),
 scene('돌아온 약함','resident','연아가 빈 약함을 다시 가져왔습니다. 이번에는 누가 어떤 책임을 맡았는지 기록이 함께 들어 있습니다.',[
  option('주민과 동문의 역할을 함께 남긴다',0,0,{},{relation:['resident',1],flag:'shared-credit'}),option('사부에게 부족했던 대비까지 보고한다',0,0,{},{relation:['master',1],flag:'honest-report'})])
 ]};
const hs02={id:'C-HS-02',origin:'P-HUASHAN',title:'나란히 서는 두 검',summary:'동문과 같은 공적을 겨루던 일이 길목의 공동 대응으로 번졌습니다. 공적과 책임을 어떻게 나눌지 정합니다.',role:'공동 대응의 책임자',enemyKey:'campaign-hs02',
 npcs:[{id:'master',name:'선택한 사부',role:'화산의 사부',symbol:'梅'},{id:'peer',name:'백린',role:'함께 시험받는 동문',symbol:'同'},{id:'witness',name:'영선',role:'길목 장부를 맡은 인연',symbol:'客'}],
 enemy:{id:'E-CAMPAIGN-HS02',name:'약속을 흔드는 도전자',realm:2,mastery:50,style:'쾌',mode:'duel',faction:'F-NORMAL',cost:8,foundation:{inner:60000,outer:80000},preparationHint:'빠른 검을 잇지만 내공이 길지 않습니다. 협력으로 압박을 줄이고, 무기와 주력 구성을 함께 살펴보세요.'},
 scenes:[
 scene('나란히 선 두 제자','master','사부가 같은 임무장을 두 제자 앞에 놓습니다. 백린은 먼저 이름을 남기고 싶다고 숨김없이 말합니다.',[option('각자 맡을 일을 분명히 적는다',0,0,{standing:1},{flag:'separate-duty'}),option('함께 완수한 부분은 함께 적자고 제안한다',0,0,{support:1},{flag:'shared-credit',relation:['peer',1]})]),
 scene('첫 비무의 약속','peer','검법을 배웠다는 말만으로 서로의 간격을 알 수는 없습니다. 백린은 첫 실전 경험을 숨기지 말자고 합니다.',[option('잘된 초식과 막힌 초식을 모두 적는다',0,0,{information:1},{flag:'honest-practice'}),option('따로 준비한 수를 먼저 설명한다',1,0,{standing:1},{flag:'own-method'})],{gate:'learning'}),
 scene('공을 누구에게 돌릴까','master','첫 비무 기록에는 승패와 실제 발동이 함께 남았습니다. 사부는 누구의 조언을 사용했는지 묻습니다.',[option('자신이 판단한 순간을 먼저 설명한다',0,0,{standing:1},{flag:'self-proof'}),option('동문의 조언과 자신의 판단을 구별한다',0,0,{support:1,information:1},{relation:['peer',1],flag:'credit-sources'})],{gate:'practice'}),
 scene('서로 다른 수련','peer','백린은 빠르게 들어가는 검을 믿고, 너는 그 뒤의 빈틈을 봅니다. 같은 연습을 강요하지 않고 차이를 다룰 방법을 정합니다.',[option('서로의 빈틈을 별도로 기록한다',1,0,{information:1},{flag:'gap-record'}),option('함께 멈출 신호를 정한다',1,0,{support:1},{flag:'joint-signal',relation:['peer',1]})],{variants:variants(
  ['실제 비무 기록에서 먼저 지친 쪽의 발동이 끊긴 시점을 찾았습니다.',option('기록에 남은 소모를 기준으로 역할을 나눈다',0,0,{information:1,standing:1},{flag:'resource-roles'})],
  ['끝낸 일거리에는 둘이 다른 길로 움직여도 인계할 수 있는 지점이 남아 있습니다.',option('인계 지점에서만 서로 맞추기로 한다',0,0,{support:1},{flag:'handover-only'})],
  ['앞서 공적의 출처를 구별해 준 일 때문에 백린이 실패한 수를 보여 줍니다.',option('드러낸 약점을 밖에 말하지 않기로 한다',0,0,{support:1},{flag:'private-lesson',relation:['peer',1]})])}),
 scene('사부의 관찰','master','사부는 둘을 한 사람처럼 평가하지 않겠다고 합니다. 다음 임무에서 어떤 책임으로 평가받을지 고릅니다.',[option('검증한 판단의 정확성으로 평가받는다',0,0,{information:1},{flag:'audit-standard'}),option('맡은 구간을 끝내는 책임으로 평가받는다',0,0,{standing:1},{flag:'delivery-standard'})]),
 scene('두 장의 임무장','witness','강호의 일을 끝내고 돌아오자 영선이 비슷한 의뢰 두 장을 펼칩니다. 이름만 다를 뿐 같은 주민이 두 번 비용을 내고 있습니다.',[option('같은 의뢰인지 장부를 대조한다',1,0,{information:2},{flag:'duplicate-proof'}),option('각자의 담당 비용을 다시 합의한다',1,0,{standing:1,support:1},{flag:'cost-split'})],{gate:'work'}),
 scene('겹친 길목','peer','백린은 자신이 먼저 맡은 길이라고 말합니다. 길을 둘로 나누거나 함께 지키되 책임을 구별할 수 있습니다.',[option('별도 우회로를 맡아 직접 확인한다',3,0,{standing:2},{flag:'own-route'}),option('도구를 사서 길의 입구와 출구를 나눠 맡는다',0,10,{supplies:1,support:1},{flag:'paired-posts'})]),
 scene('보이지 않은 수고','witness','영선은 이름이 없는 운반인의 도움으로 의뢰가 끝났다고 말합니다. 눈에 보인 검만 공적으로 남겨도 되는지 묻습니다.',[option('도움의 출처를 장부에 남긴다',0,0,{information:1},{relation:['witness',1],flag:'workers-credit'}),option('운반 비용을 따로 지불한다',0,20,{supplies:1},{relation:['witness',1],flag:'workers-paid'}),option('직접 운반 구간을 확인하고 보고한다',1,0,{standing:1},{flag:'workers-survey'})]),
 scene('공적을 적는 자리','master','서로 다른 보고가 한 책상에 놓였습니다. 공적을 나눌지, 자기 몫을 증명할지, 더 확인할지 고릅니다.',[option('함께 한 일만 공동 공적으로 적는다',0,0,{support:2},{requires:{flag:'credit-sources'},relation:['peer',1],flag:'joint-report'}),option('자신의 완료 기록을 별도로 검증한다',1,0,{information:1,standing:1},{flag:'verified-own-credit'})],{variants:variants(
  ['비무 기록은 상대의 실수와 자신의 대응을 구별해 줍니다.',option('공적 대신 대응 근거를 제출한다',1,0,{information:2},{flag:'technical-report'})],
  ['완료한 일거리의 인계자가 두 사람의 역할을 확인할 수 있습니다.',option('인계자의 서명을 받아 공적을 분리한다',0,10,{standing:2},{flag:'signed-credit'})],
  ['백린은 앞서 지켜 준 실패의 비밀을 기억하고 자기 보고도 내놓습니다.',option('서로 동의한 사실만 공동 보고한다',0,0,{support:2},{flag:'consented-report',relation:['peer',1]})])}),
 scene('동문의 대답','peer','백린은 같은 평가를 바라지는 않는다고 말합니다. 네 방식에 동의하지 않더라도 다음 일을 함께 할 여지는 남아 있습니다.',[option('공동 대응을 제안한다',0,0,{support:1},{flag:'team-offer',relation:['peer',1]}),option('공동 제안을 거절하고 연락 규칙만 남긴다',1,0,{information:1},{flag:'independent-contact',relation:['peer',-1]})]),
 scene('퍼진 소문','witness','한 사람이 다른 사람의 공을 빼앗았다는 말이 퍼졌습니다. 영선은 소문을 덮기보다 어느 사실이 빠졌는지 알고 싶어 합니다.',[option('공적의 출처 기록을 공개한다',0,0,{information:1},{requires:{flag:'workers-credit'},flag:'public-record'}),option('전달 경로를 직접 역추적한다',1,0,{information:2},{flag:'rumor-route'}),option('장부 정리 인력을 고용한다',0,10,{supplies:1},{flag:'paid-audit'})]),
 scene('외부인의 증언','witness','영선의 증언은 네 주장 일부와 어긋납니다. 불리한 내용도 남길지 선택해야 합니다.',[option('불리한 부분도 함께 기록한다',0,0,{information:2},{relation:['witness',1],flag:'full-testimony'}),option('현재 확인할 수 있는 범위만 재조사한다',1,0,{standing:1},{flag:'limited-testimony'})]),
 scene('동문의 실수','peer','백린이 먼저 움직여 인계가 어긋났습니다. 공개적으로 책임을 묻거나 손실부터 수습할 수 있습니다.',[option('손실을 줄이고 둘의 책임을 따로 묻는다',1,0,{support:1},{relation:['peer',1],flag:'repair-first'}),option('자신의 구간을 지키고 경계를 다시 긋는다',1,0,{standing:2},{relation:['peer',-1],flag:'strict-boundary'}),option('공동 적립금 대신 자기 돈으로 인계를 복구한다',0,20,{supplies:1},{flag:'own-repair'})]),
 scene('함께 확인할 사람','master','두 보고가 계속 어긋납니다. 사부가 직접 중재하기 전에 누구를 확인자로 세울지 고릅니다.',[option('영선과 현장을 다시 확인한다',1,0,{information:1},{relation:['witness',1],flag:'outside-check'}),option('사부의 중재를 청하고 별도 임무를 맡는다',3,0,{standing:1},{relation:['master',1],flag:'master-mediation'})],{variants:variants(
  ['수련에서 실제로 수행한 움직임을 같은 조건에서 보여 줄 수 있습니다.',option('주장의 움직임을 직접 재현해 검증한다',1,0,{information:2},{flag:'reproduced-proof'})],
  ['완료한 의뢰의 장부는 현장에 없던 사람도 인계를 확인하게 해 줍니다.',option('두 장부의 시각을 맞춰 증언을 검토한다',0,0,{information:1,standing:1},{flag:'timestamp-proof'})],
  ['함께 사실을 기록한 인연이 양쪽의 말을 들어 주겠다고 합니다.',option('서로 동의하는 확인자에게 설명한다',0,0,{support:1,information:1},{flag:'agreed-witness'})])}),
 scene('다시 정한 거리','peer','백린은 함께 서도 모든 판단에 동의할 필요는 없다고 말합니다. 앞으로 실패를 알릴 방식을 정합니다.',[option('실패부터 알리고 도움을 요청한다',0,0,{support:1},{flag:'early-warning',relation:['peer',1]}),option('각자 해결하되 위험 구간은 공유한다',1,0,{information:1},{flag:'parallel-warning'})]),
 scene('공동 대응의 요청','master','길목의 도전자가 두 제자의 갈라진 틈을 노립니다. 지금까지 쌓은 기반으로 대응 방식을 정합니다.',[option('서로 교대할 시간을 실제로 맞춘다',1,0,{support:1},{flag:'practiced-relay'}),option('자기 구간에 필요한 도구를 산다',0,20,{supplies:2},{flag:'solo-kit'})],{gate:'training'}),
 scene('서로 다른 상대','witness','도전자는 첫 발을 빠르게 내딛지만 다음 호흡을 크게 씁니다. 영선은 확인하지 못한 추측을 사실처럼 전하지 않습니다.',[option('기록에 남은 첫 발을 분석한다',1,0,{information:2},{flag:'opening-proof'}),option('백린과 서로 다른 진입로를 맡는다',0,0,{support:1},{requires:{flag:'paired-posts'},flag:'split-entry'}),option('추가 목격자를 찾아 확인한다',3,0,{information:1},{flag:'second-witness'})]),
 scene('누가 앞에 설까','peer','앞에 서는 사람만 공적을 얻는다면 뒤를 맡을 사람이 없습니다. 책임과 기록을 먼저 분리합니다.',[option('자기 이름으로 선봉 책임을 진다',1,0,{standing:2},{flag:'own-vanguard'}),option('뒤를 맡는 동문의 공적을 미리 적는다',0,0,{support:2},{requires:{flag:'joint-report'},relation:['peer',1],flag:'rear-credit'}),option('교대가 필요 없게 우회 지점을 만든다',3,0,{supplies:1},{flag:'independent-post'})]),
 scene('손발을 맞출 기회','peer','서로 다른 준비를 실제 한 순서로 묶어야 합니다. 이미 한 수련을 다시 세기보다 지금 어긋나는 부분을 확인합니다.',[option('멈추는 순간만 함께 점검한다',1,0,{support:1},{flag:'stop-rehearsal'}),option('진입 표식을 마련해 역할을 분리한다',0,10,{supplies:1},{flag:'entry-markers'})],{variants:variants(
  ['비무에서 끝까지 유지한 자세가 실제 기록에 남아 있습니다.',option('서로 버티는 시간을 기준으로 교대한다',0,0,{information:1,support:1},{flag:'tested-endurance'})],
  ['의뢰에서 사용한 시간차 인계가 공동 진입에도 맞습니다.',option('물품 인계 순서를 진입 순서로 쓴다',0,0,{supplies:1,information:1},{flag:'timed-entry'})],
  ['서로 실패를 알리기로 한 약속이 도움 요청을 쉽게 만듭니다.',option('위험을 감추지 않는 신호를 확인한다',0,0,{support:2},{flag:'trusted-warning'})])}),
 scene('어긋난 신호','master','마지막 확인에서 한 신호가 반대로 전달됐습니다. 누가 틀렸는지보다 다음 오해를 막는 방식을 정합니다.',[option('역할을 줄이고 신호 하나만 남긴다',1,0,{information:1},{flag:'single-signal'}),option('합의한 확인자에게 전달을 맡긴다',0,0,{support:1},{requires:{flag:'agreed-witness'},flag:'witness-relay'}),option('별도 표식을 추가한다',0,10,{supplies:1},{flag:'extra-markers'})]),
 scene('먼저 들어갈 사람','peer','도전자는 둘이 서로 양보하거나 다투는 순간을 기다립니다. 앞선 책임 분담을 실제 순서로 바꿉니다.',[option('자기 구간을 먼저 맡고 신호를 보낸다',1,0,{standing:1},{requires:{flag:'own-route'},flag:'solo-entry'}),option('함께 확인한 순서대로 움직인다',1,0,{support:1},{flag:'coordinated-entry'}),option('따로 우회해 자리를 확보한다',3,0,{standing:1},{flag:'wide-entry'})]),
 scene('동문이 비운 자리','witness','백린이 주민을 옮기느라 약속한 자리에 늦습니다. 빈자리를 탓하는 동안 길목은 열려 있습니다.',[option('인계 규칙에 따라 잠시 대신 맡는다',1,0,{support:1},{requires:{flag:'independent-contact'},flag:'covered-gap'}),option('품삯을 내고 안내인을 세운다',0,20,{supplies:1},{flag:'paid-gap'}),option('범위를 줄이고 직접 돌아본다',3,0,{standing:1},{flag:'narrow-duty'})]),
 scene('공과 책임','master','결과가 나기 전에 공적부터 약속해 달라는 요청이 왔습니다. 네가 감당할 책임만 분명히 남깁니다.',[option('함께 맡은 범위만 공동 기록한다',0,0,{support:1},{requires:{flag:'cost-split'},flag:'shared-boundary'}),option('확인할 수 있는 자기 책임만 서명한다',1,0,{standing:1},{flag:'signed-duty'})]),
 scene('다시 마주한 비무장','peer','도전자가 실력으로 결판을 요구합니다. 실제 기록으로 논쟁을 끝내거나 검을 겨루되, 동문의 도움은 확보한 만큼만 기대할 수 있습니다.',[option('현장 증거로 도전의 구실을 반박한다',1,0,{standing:1},{requires:{resource:'information',min:5},flag:'evidence-ending'}),option('준비한 역할대로 검을 겨룬다',1,0,{standing:2},{battle:true,flag:'sword-ending'}),option('임무 인계를 끝내고 불필요한 겨룸을 거절한다',3,0,{standing:1},{flag:'duty-ending'})],{variants:variants(
  ['실제 비무 경험에서 배운 거리로 첫 발의 빈틈을 확인했습니다.',option('확인한 첫 발에 맞춰 겨룬다',1,0,{standing:2},{battle:true,flag:'measured-ending'})],
  ['인계 장부를 끝내면 공적을 둘러싼 분쟁의 당사자들이 물러납니다.',option('최종 인계를 함께 확인해 분쟁을 끝낸다',1,0,{standing:1},{flag:'handover-ending'})],
  ['입장을 달리했던 인연들도 확인한 사실에는 동의합니다.',option('합의된 사실로 역할 분담을 승인받는다',1,0,{support:1},{flag:'agreed-ending'})])}),
 scene('사문에 남은 평판','master','사부는 이 일로 둘을 서열 하나에 넣지 않습니다. 어떤 근거로 역할을 맡았는지 각자의 기록에 남깁니다.',[option('독자적으로 책임진 범위를 남긴다',0,0,{},{flag:'independent-credit',relation:['master',1]}),option('함께 바로잡은 판단을 남긴다',0,0,{},{flag:'reconciled-credit',relation:['peer',1]})])
 ]};
const ha01={id:'C-HA-01',origin:'S-HAOMEN',title:'전언의 값과 사람의 자리',summary:'상단이 사려는 정보에 동료의 생활이 묶여 있습니다. 확인할 사실과 지킬 출처, 거래의 책임을 구별합니다.',role:'전언을 책임지는 연락자',enemyKey:'campaign-ha01',
 npcs:[{id:'master',name:'선택한 사부',role:'하오의 사부',symbol:'燈'},{id:'peer',name:'소란',role:'전언을 맡은 동료',symbol:'同'},{id:'buyer',name:'도윤',role:'정보를 사는 상단 교섭자',symbol:'客'}],
 enemy:{id:'E-CAMPAIGN-HA01',name:'출처를 쫓는 정보 중개자',realm:1,mastery:38,style:'환',mode:'duel',faction:'F-NORMAL',cost:5,foundation:{inner:70000,outer:10000}},
 scenes:[
 scene('닫힌 찻집의 전언','peer','소란이 찻집의 문을 닫고 전언을 건넵니다. 내용은 팔 수 있어도 누가 보냈는지는 쉽게 말할 수 없습니다.',[option('전언보다 거래 조건을 먼저 적는다',0,0,{standing:1},{flag:'written-terms'}),option('보낸 사람의 이름은 가리겠다고 약속한다',0,0,{support:1},{flag:'protected-source',relation:['peer',1]})]),
 scene('처음 맡은 전달','master','배운 검은 전언을 빼앗기지 않게 해도 진위를 증명하지는 못합니다. 처음 전달할 범위를 정합니다.',[option('직접 확인한 부분만 전달한다',1,0,{information:1},{flag:'checked-message'}),option('미확인이라고 밝히고 약정부터 받는다',0,0,{standing:1},{flag:'provisional-contract'})],{gate:'learning'}),
 scene('이름을 묻는 손님','buyer','비무로 몸을 지키는 법을 익힌 뒤에도 이름을 묻는 손님은 남습니다. 도윤은 출처를 밝히면 확인 비용을 줄이겠다고 합니다.',[option('이름 대신 확인할 질문을 받는다',0,0,{information:1},{flag:'questions-only'}),option('제보자의 동의부터 직접 구한다',1,0,{support:1},{relation:['peer',1],flag:'consent-first'})],{gate:'practice'}),
 scene('동료의 경고','peer','누군가 같은 전언을 더 싼값에 판다는 소식이 왔습니다. 소란은 빠른 거래가 정확한 거래는 아니라고 경고합니다.',[option('판매자의 말과 실제 현장을 비교한다',1,0,{information:2},{flag:'compared-rumor'}),option('비용을 내고 거래 내역을 확인한다',0,10,{information:1},{flag:'paid-record'})],{variants:variants(
  ['비무 중 본 움직임과 전언 속 인상착의가 맞지 않습니다.',option('직접 본 동작만 근거로 진술을 좁힌다',1,0,{information:2},{flag:'observed-movement'})],
  ['완료한 일거리의 도착 시각이 판매자의 주장과 다릅니다.',option('운송 시각으로 전언의 순서를 확인한다',0,0,{information:1},{flag:'arrival-proof'})],
  ['출처를 가리겠다는 약속 덕에 소란이 장소의 일부를 알려 줍니다.',option('사람 대신 장소를 확인하기로 한다',0,0,{support:1,information:1},{flag:'place-contact'})])}),
 scene('사부에게 남긴 말','master','사부는 거래를 대신 결정해 주지 않습니다. 이번 일에서 네가 책임질 기준을 묻습니다.',[option('출처의 안전을 먼저 책임진다',0,0,{support:1},{flag:'safety-duty'}),option('거래한 사실의 정확성을 책임진다',0,0,{information:1},{flag:'accuracy-duty'})]),
 scene('값이 붙은 소문','buyer','강호에서 일을 마치자 도윤이 소문의 가격을 제시합니다. 거래를 서두르는 대가로 확인 과정은 네 몫이 됩니다.',[option('검증 비용을 내고 정식 약정을 맺는다',0,20,{standing:2},{flag:'formal-contract',relation:['buyer',1]}),option('돈 없이 직접 확인하고 다시 만난다',3,0,{information:2},{flag:'self-evidence'})],{gate:'work'}),
 scene('확인되지 않은 길','peer','전언에 나온 길이 실제로는 끊겨 있다는 말이 있습니다. 소란을 보내면 네 시간은 줄지만 동료가 노출됩니다.',[option('소란에게 이름 없이 표식만 확인해 달라고 맡긴다',1,0,{support:1},{flag:'anonymous-task',relation:['peer',1]}),option('직접 우회해 연결된 길을 확인한다',3,0,{information:2},{flag:'walked-route'}),option('안내인을 고용해 공개된 길만 확인한다',0,10,{supplies:1},{flag:'public-guide'})]),
 scene('거래 기한','buyer','도윤은 약정한 시각을 넘기기 전에 중간 보고를 요구합니다. 확인하지 못한 사실을 확정 정보처럼 팔지는 않겠다고 정합니다.',[option('약정에 미확인 항목을 추가한다',0,0,{standing:1},{requires:{flag:'formal-contract'},flag:'amended-contract'}),option('확인 기간을 더 쓰고 거래를 미룬다',1,0,{information:1},{flag:'extended-check'}),option('연락 비용을 내고 확인자를 먼저 부른다',0,10,{support:1},{flag:'called-checker'})]),
 scene('동료를 부를까','peer','소란이 연락을 대신해 주겠다고 합니다. 거절해도 직접 확인할 수 있지만 부탁을 맡기는 것만으로 정보가 생기지는 않습니다.',[option('익명 연락을 부탁하고 인계까지 기다린다',1,0,{support:1},{flag:'accepted-contact',relation:['peer',1]}),option('부탁을 거절하고 직접 확인한다',3,0,{information:2},{flag:'declined-contact'})],{variants:variants(
  ['발품을 팔며 배운 기동으로 공개된 장소는 직접 확인할 수 있습니다.',option('공개된 길만 직접 살펴 출처를 숨긴다',1,0,{information:1},{flag:'open-survey'})],
  ['마친 일거리의 인계자가 확인할 연락 지점을 알고 있습니다.',option('업무 인계자에게 전달 여부만 묻는다',1,0,{information:1,support:1},{flag:'work-contact'})],
  ['소란과 합의한 비밀 연락 방식이 이미 있습니다.',option('합의한 신호로 연락의 도착만 확인한다',1,0,{support:2},{flag:'quiet-contact'})])}),
 scene('첫 인계의 책임','buyer','도윤은 확인된 내용과 남은 추측을 나눠 받겠다고 합니다. 누구의 책임으로 인계할지 정합니다.',[option('자기 이름으로 확인한 부분에 서명한다',0,0,{standing:1},{flag:'signed-evidence'}),option('출처를 밝히고 추가 증언을 붙인다',0,0,{information:2},{flag:'source-exposed',relation:['peer',-2]})]),
 scene('다시 찾아온 구매자','buyer','전언의 일부가 맞았지만 다음 거래의 범위는 더 넓습니다. 도윤은 과거 약정이 새 정보까지 포함하지는 않는다고 말합니다.',[option('기존 약정의 범위를 근거로 다시 협상한다',0,0,{standing:2},{requires:{flag:'formal-contract'},flag:'contract-renewal'}),option('새 항목은 별도로 확인하고 답한다',1,0,{information:1},{flag:'separate-proof'}),option('거래를 줄이고 연락 통로만 유지한다',0,10,{support:1},{flag:'limited-trade'})]),
 scene('출처를 찾는 사람','peer','누군가 소란의 거처를 묻고 다닙니다. 앞서 이름을 숨겼는지 드러냈는지가 지금의 연락 비용을 바꿉니다.',[option('이름을 지킨 연락선을 그대로 사용한다',1,0,{support:1},{requires:{flag:'protected-source',notFlag:'source-exposed'},flag:'safe-channel'}),option('거처를 옮길 비용을 마련한다',0,20,{supplies:1},{flag:'moved-contact',relation:['peer',1]}),option('직접 떨어진 장소를 오가며 연락한다',3,0,{information:1},{flag:'own-channel'})]),
 scene('다른 길의 목격담','buyer','새 목격담은 기존 전언과 반대입니다. 맞는 말만 모으면 틀린 거래가 오래 남을 수 있습니다.',[option('서로 다른 증거의 시점을 대조한다',1,0,{information:2},{flag:'dated-evidence'}),option('상단의 확인 인력을 빌린다',0,0,{support:1},{requires:{flag:'amended-contract'},flag:'contract-checker'}),option('독립된 증언을 구할 비용을 낸다',0,10,{information:1},{flag:'independent-witness'})]),
 scene('동료의 거처','peer','소란은 네가 돕겠다고 말한 것과 실제로 지킨 것을 구별합니다. 돌아갈 자리를 약속할지 연락만 남길지 정합니다.',[option('함께 머물 안전한 자리를 직접 찾는다',3,0,{support:1},{relation:['peer',1],flag:'shared-shelter'}),option('연락 장소를 빌려 서로 떨어져 지낸다',0,20,{supplies:2},{flag:'rented-contact'})],{variants:variants(
  ['몸을 움직여 확인한 경로 덕에 공개된 장소 사이를 연결할 수 있습니다.',option('잠긴 거처 대신 공개된 이동 경로를 쓴다',1,0,{information:1},{flag:'mobile-contact'})],
  ['일거리에서 쓰던 인계함은 사람의 거처를 공개하지 않아도 됩니다.',option('업무용 인계함을 따로 빌린다',0,10,{supplies:1},{flag:'work-dropbox'})],
  ['지켜 온 약속 때문에 소란이 스스로 가능한 연락 시각을 알려 줍니다.',option('소란이 정한 시간에만 연락한다',1,0,{support:2},{flag:'consented-contact'})])}),
 scene('거래를 고쳐 쓴다','buyer','도윤은 기존 약정의 실수를 지워 달라고 하지 않습니다. 무엇이 바뀌었고 무엇을 더는 팔지 않을지 적습니다.',[option('출처에 대한 거래를 제외한다',0,0,{support:1},{flag:'no-source-sale',relation:['peer',1]}),option('검증 절차를 포함한 거래로 바꾼다',1,0,{standing:1},{flag:'verified-contract',relation:['buyer',1]})]),
 scene('서로 어긋난 정보','master','직접 수련한 경험과 전달받은 상대의 특징이 어긋납니다. 확인된 준비와 추측을 나누는 마지막 단계입니다.',[option('실제로 본 움직임만 따로 정리한다',1,0,{information:2},{flag:'verified-opponent'}),option('출처가 다른 두 경고를 분리해 전달한다',1,0,{support:1},{flag:'separate-warnings'})],{gate:'training'}),
 scene('먼저 확인할 곳','peer','정보 중개자는 오래 내공을 운용하며 거짓 움직임을 섞습니다. 사람을 쫓을지, 그가 쓰는 연락 수단을 확인할지 고릅니다.',[option('연락에 쓰는 물자의 이동을 확인한다',1,0,{information:2},{flag:'supply-trail'}),option('소란과 나눠 보고 서로 확인한다',0,0,{support:2},{requires:{flag:'safe-channel'},flag:'paired-observation'}),option('추적을 줄이고 공개된 거래만 조사한다',3,0,{information:1},{flag:'public-records'})]),
 scene('준비에 쓸 돈','buyer','도윤은 준비 비용을 거래의 성과와 섞어 계산하지 말자고 합니다. 지금 지불할 돈과 나중에 얻을 정보를 구별합니다.',[option('대조용 장부와 도구를 구입한다',0,30,{supplies:3},{flag:'audit-kit'}),option('기존 기록을 직접 정리해 도구를 대신한다',3,0,{information:1},{flag:'manual-audit'}),option('고쳐 쓴 약정으로 확인 자료를 빌린다',1,0,{supplies:1},{requires:{flag:'verified-contract'},flag:'contract-tools'})]),
 scene('동료의 마지막 전언','peer','소란이 마지막 전언을 남겼습니다. 누가 보낸 말인지보다 앞선 확인과 맞는지를 살펴야 합니다.',[option('연락 암호와 실제 시각을 대조한다',1,0,{information:1},{flag:'checked-last-message'}),option('직접 만나 말의 빠진 부분을 듣는다',3,0,{support:1},{relation:['peer',1],flag:'last-meeting'})],{variants:variants(
  ['몸으로 확인했던 길은 이 시각에 건널 수 없습니다.',option('불가능한 이동 시각을 증거로 남긴다',0,0,{information:2},{flag:'impossible-time'})],
  ['일거리의 완료 기록에 같은 봉인이 남아 있습니다.',option('인계 봉인의 다른 흔적을 확인한다',1,0,{information:1,supplies:1},{flag:'seal-proof'})],
  ['소란이 동의한 연락 방식과 이번 전언이 다릅니다.',option('합의한 신호로 동료의 안전부터 확인한다',1,0,{support:2},{flag:'living-contact'})])}),
 scene('상대의 빈틈','master','확인한 정보가 많아도 전투 결과를 미리 바꿀 수는 없습니다. 정보와 협력을 어디에 쓸지 정합니다.',[option('중개자의 준비 자금을 확인해 공개한다',1,0,{information:1},{flag:'funding-proof'}),option('도움을 약속한 이들에게 연락을 분산한다',0,0,{support:1},{requires:{resource:'support',min:4},flag:'distributed-warning'}),option('필요한 연락 도구를 추가한다',0,10,{supplies:1},{flag:'spare-signals'})]),
 scene('정보의 값을 정한다','buyer','중개자는 이름을 넘기면 거래를 끝내겠다고 합니다. 과거의 약정과 확인한 사실로 다른 값을 정할 수 있습니다.',[option('서명한 증거를 조건으로 거래를 끝낸다',1,0,{standing:1},{requires:{flag:'signed-evidence'},flag:'proof-settlement'}),option('이름 거래를 거절하고 자체 연락을 잇는다',3,0,{support:1},{flag:'independent-settlement'}),option('자료 보관 비용을 내고 양쪽에 같은 기록을 남긴다',0,20,{supplies:1},{flag:'shared-archive'})]),
 scene('거래와 구출 사이','peer','소란은 거래의 빈칸을 메우는 도구가 되지 않겠다고 말합니다. 원하는 도움을 먼저 물을지 약정 마무리를 우선할지 정합니다.',[option('동료가 원하는 장소로 함께 이동한다',1,0,{support:1},{relation:['peer',1],flag:'chosen-safety'}),option('약정을 마치고 별도 보호 비용을 남긴다',0,20,{standing:1},{relation:['buyer',1],flag:'separate-protection'}),option('거래를 거절하고 안전한 연락을 직접 맡는다',3,0,{standing:1},{flag:'refused-trade'})]),
 scene('밝혀야 할 사실','master','사부는 승산을 높이려고 없던 증거를 만들지 말라고 합니다. 누구의 실수를 공개할지보다 확인 범위를 적습니다.',[option('자기 오판과 수정한 근거도 함께 공개한다',0,0,{information:1},{relation:['master',1],flag:'corrected-record'}),option('동의한 당사자에게만 제한해 전달한다',1,0,{support:1},{flag:'limited-disclosure'})]),
 scene('살아남은 연락선','peer','중개자가 마지막으로 길을 막습니다. 정보로 요구를 무너뜨리거나 검을 겨루고, 어느 쪽도 어렵다면 다른 연락선을 직접 열 수 있습니다.',[option('대조한 증거로 거짓 거래를 중단시킨다',1,0,{standing:1},{requires:{resource:'information',min:5},flag:'proved-ending'}),option('준비한 수단으로 중개자와 겨룬다',1,0,{standing:2},{battle:true,flag:'challenged-ending'}),option('기존 거래를 포기하고 새 연락선을 연다',3,0,{standing:1},{flag:'new-contact-ending'})],{variants:variants(
  ['수련과 비무에서 익힌 호흡으로 거짓 진입을 가려낼 준비를 했습니다.',option('확인한 호흡을 기준으로 중개자와 겨룬다',1,0,{standing:2},{battle:true,flag:'read-breath-ending'})],
  ['완료한 일거리의 인계 기록이 거짓 거래를 직접 반박합니다.',option('인계 기록을 거래 당사자에게 동시에 제출한다',1,0,{standing:1},{flag:'delivery-ending'})],
  ['서로 다른 인연이 같은 사실을 확인해 줄 수 있습니다.',option('동의한 확인자들을 통해 거짓 전언을 끊는다',1,0,{support:1},{flag:'witness-ending'})])}),
 scene('사부의 평가','master','사부는 정보의 값보다 그 뒤에 남은 사람과 책임을 봅니다. 네가 지킨 기준을 생애의 기록에 남깁니다.',[option('확인한 사실을 끝까지 책임진 사람으로 남는다',0,0,{},{flag:'evidence-role',relation:['buyer',1]}),option('이름을 함부로 팔지 않는 연락자로 남는다',0,0,{},{flag:'safety-role',relation:['peer',1]})])
 ]};
const ha02={id:'C-HA-02',origin:'S-HAOMEN',title:'흩어진 등불의 몫',summary:'세 연락선이 길목의 몫을 두고 다툽니다. 나눌 책임과 독자적인 길, 협상의 조건을 실제로 마련합니다.',role:'길목 연락의 조정자',enemyKey:'campaign-ha02',
 npcs:[{id:'master',name:'선택한 사부',role:'하오의 사부',symbol:'燈'},{id:'peer',name:'진목',role:'흩어진 연락선의 동료',symbol:'同'},{id:'broker',name:'하진',role:'참여 조건을 중개하는 인연',symbol:'客'}],
 enemy:{id:'E-CAMPAIGN-HA02',name:'길목의 몫을 독점한 도전자',realm:3,mastery:55,style:'강',mode:'duel',faction:'F-NORMAL',cost:9,foundation:{inner:180000,outer:220000},preparationHint:'한 지점에서 강한 압박을 오래 유지합니다. 현재 내공으로 검법을 이어갈 수 있는지, 운기와 외공 준비를 살펴보세요.'},
 scenes:[
 scene('끊어진 세 연락선','master','같은 길을 쓰던 세 연락선이 서로 소식을 끊었습니다. 사부는 누구를 우두머리로 세우기보다 무엇이 끊겼는지 묻습니다.',[option('각자의 손실부터 따로 듣는다',0,0,{information:1},{flag:'separate-losses'}),option('중개할 수 있는 범위를 먼저 알린다',0,0,{standing:1},{flag:'limited-mandate'})]),
 scene('처음 만난 동료','peer','배운 검을 본 진목은 혼자 길을 지킬 생각인지 묻습니다. 같이 일할 것과 혼자 책임질 것을 구분합니다.',[option('서로 맡을 몫을 함께 기록한다',0,0,{support:1},{flag:'shared-shares',relation:['peer',1]}),option('자기 연락 구간을 직접 확인한다',1,0,{standing:1},{flag:'own-line'})],{gate:'learning'}),
 scene('나눌 몫의 약속','broker','첫 비무 기록을 보고 하진이 위험 부담도 몫에 넣자고 합니다. 빠른 승리만으로 모두의 몫을 정하지 않습니다.',[option('위험을 맡은 범위에 따라 몫을 구별한다',0,0,{standing:1},{flag:'risk-shares'}),option('보이지 않은 전달의 몫도 남긴다',0,0,{support:1},{relation:['broker',1],flag:'delivery-shares'})],{gate:'practice'}),
 scene('혼자 갈 길','peer','진목은 공동 약속이 깨질 경우도 준비하자고 합니다. 따로 갈 길을 만드는 일이 곧 배신은 아닙니다.',[option('독자 연락 경로를 직접 살핀다',3,0,{information:1,standing:1},{flag:'backup-line'}),option('공동 인계 도구를 마련한다',0,10,{supplies:1,support:1},{flag:'shared-tools'})],{variants:variants(
  ['실제로 비무에서 버틴 시간은 혼자 감당할 범위를 보여 줍니다.',option('감당할 수 있는 구간만 맡는다',1,0,{standing:2},{flag:'bounded-duty'})],
  ['완료한 일거리에서 사람 없이도 사용할 인계 지점을 찾았습니다.',option('빈 인계 지점을 별도 연락선으로 쓴다',1,0,{information:1,supplies:1},{flag:'empty-post'})],
  ['각자의 몫을 적어 준 일 때문에 동료들이 대안을 내놓습니다.',option('서로 다른 대안을 공동 기록으로 남긴다',0,0,{support:2},{flag:'shared-options'})])}),
 scene('사부가 맡긴 연락','master','사부는 하오 전체의 주도권을 약속하지 않습니다. 이번 길목에서 맡을 수 있는 책임만 정합니다.',[option('각자의 연락을 잇는 중개를 맡는다',0,0,{support:1},{flag:'mediator-duty'}),option('독자 연락 하나를 끝까지 책임진다',0,0,{standing:1},{flag:'independent-duty'})]),
 scene('서로 다른 청구서','broker','강호의 일을 마치자 같은 물품에 서로 다른 청구가 붙어 있습니다. 누가 더 냈는지보다 무엇을 함께 썼는지 확인합니다.',[option('공동 사용분을 따로 대조한다',1,0,{information:2},{flag:'shared-bill'}),option('지금 필요한 도구만 자기 비용으로 산다',0,20,{supplies:2},{flag:'own-tools'})],{gate:'work'}),
 scene('빈 연락 자리','peer','다음 전달을 맡을 사람이 빠졌습니다. 진목은 모두에게 같은 부담을 요구하지 말자고 합니다.',[option('직접 빈 구간을 맡아 연결한다',3,0,{standing:1},{flag:'filled-alone'}),option('공동 몫의 약속을 근거로 교대를 청한다',1,0,{support:1},{requires:{flag:'shared-shares'},flag:'shared-relay'}),option('대체 전달자를 고용한다',0,10,{supplies:1},{flag:'hired-relay'})]),
 scene('표국의 제안','broker','표국에서 함께 움직이자는 제안이 왔습니다. 표행을 맡지 않아도 공개된 인계 장소를 이용할 방법은 있습니다.',[option('표행 대신 인계 장소 사용료만 낸다',0,10,{supplies:1},{flag:'rented-post'}),option('제안을 거절하고 공개된 길을 직접 확인한다',3,0,{information:1},{flag:'public-line'}),option('완료한 업무 기록으로 인계 조건을 협상한다',1,0,{support:1},{flag:'work-negotiation'})]),
 scene('몫을 다시 정한다','peer','처음 적은 몫과 실제 부담이 달라졌습니다. 진목은 이전 약속을 지우지 말고 왜 바꿨는지 남기자고 합니다.',[option('새 부담에 맞춰 모두의 몫을 다시 적는다',1,0,{support:2},{flag:'revised-shares',relation:['peer',1]}),option('자기 몫을 줄이고 독자 비용을 분리한다',1,0,{standing:2},{flag:'separate-budget'})],{variants:variants(
  ['수련과 비무에서 확인한 지구력 차이로 교대 간격을 달리할 수 있습니다.',option('동일 시간 대신 감당할 구간으로 나눈다',1,0,{support:1,standing:1},{flag:'capacity-shares'})],
  ['끝낸 일거리의 실제 운임이 처음 청구와 다릅니다.',option('실제 운임으로 물자 비용을 다시 계산한다',0,0,{information:1,supplies:1},{flag:'actual-costs'})],
  ['약속을 기록해 준 하진이 서로 양보할 범위를 알고 있습니다.',option('동의한 양보만 새 몫에 반영한다',0,0,{support:2},{flag:'consented-shares'})])}),
 scene('첫 공동 인계','broker','처음으로 연락이 제때 이어졌습니다. 한 번 성공했다고 모든 인맥이 네 말을 따르는 것은 아닙니다.',[option('성공한 인계 조건을 남긴다',0,0,{information:1},{flag:'handover-terms'}),option('다음에도 참여할지 각자에게 묻는다',0,0,{support:1},{relation:['broker',1],flag:'renewed-consent'})]),
 scene('돌아오지 않은 동료','peer','한 연락선의 동료가 제때 돌아오지 않았습니다. 찾으러 갈지 전달부터 유지할지 정해야 합니다.',[option('연락을 다른 인계자에게 맡기고 직접 찾는다',1,0,{support:1},{requires:{flag:'shared-relay'},flag:'searched-together'}),option('전달자를 고용하고 직접 찾는다',0,20,{supplies:1},{flag:'paid-search'}),option('범위를 줄여 전달과 수색을 번갈아 맡는다',3,0,{standing:1},{flag:'solo-search'})]),
 scene('두 번째 요구','broker','길목의 도전자가 연락을 계속하려면 자기 몫을 더 달라고 합니다. 이미 합의한 비용과 새 요구를 나눠야 합니다.',[option('공동 사용 청구서를 근거로 범위를 따진다',0,0,{information:1},{requires:{flag:'shared-bill'},flag:'bill-objection'}),option('요구가 생긴 구간을 직접 조사한다',1,0,{information:2},{flag:'demand-survey'}),option('다른 인계 장소를 빌린다',0,20,{supplies:1},{flag:'alternative-post'})]),
 scene('작은 연락망','peer','큰 연락망을 하나로 묶는 대신 작은 통로 몇 개를 잇는 안이 나왔습니다. 빠른 통제와 각자의 선택은 함께 얻기 어렵습니다.',[option('한곳에서 확인하되 책임을 직접 맡는다',1,0,{standing:2},{flag:'central-contact',relation:['peer',-1]}),option('각자가 동의한 통로를 느슨하게 잇는다',1,0,{support:2},{flag:'distributed-contact',relation:['peer',1]})]),
 scene('따로 서겠다는 사람','broker','하진은 공동 약정에 참여하지 않을 사람도 있다고 말합니다. 거절한 인연을 지웠다고 기록하지 않습니다.',[option('별도 인계 조건을 정해 연락만 남긴다',1,0,{information:1},{flag:'outside-contact'}),option('참여를 강요하지 않고 자기 구간을 넓힌다',3,0,{standing:1},{flag:'accepted-refusal'})],{variants:variants(
  ['실제 버틴 구간을 알고 있어 무리한 약속을 줄일 수 있습니다.',option('감당 가능한 곳까지만 직접 맡는다',1,0,{standing:1,information:1},{flag:'honest-capacity'})],
  ['완료한 일거리의 인계 방식은 약정 밖의 사람도 쓸 수 있습니다.',option('공용 인계 장소의 규칙을 따로 적는다',1,0,{supplies:1},{flag:'open-post-rules'})],
  ['다른 의견을 들은 기록이 있어 하진이 다시 이야기할 자리를 마련합니다.',option('거절 이유만 듣고 대가를 요구하지 않는다',0,0,{support:1},{flag:'heard-refusal',relation:['broker',1]})])}),
 scene('손을 다시 내민다','peer','진목은 다시 같이 일하자고 하지만 먼저 한 약속의 수정이 필요합니다. 사과만으로 비용이 사라지지는 않습니다.',[option('공동 비용을 다시 검토하고 함께 움직인다',1,0,{support:1},{flag:'renewed-team',relation:['peer',1]}),option('재합류를 거절하고 독자 연락을 유지한다',1,0,{standing:1},{flag:'kept-independent'}),option('기존 손실을 물품으로 보완한다',0,20,{supplies:2},{flag:'repaid-materials'})]),
 scene('길목의 힘겨루기','master','몸을 단련하며 버틸 수 있는 범위를 확인했습니다. 길목의 도전자는 한 번의 강한 압박으로 자리를 빼앗으려 합니다.',[option('압박을 피할 지점을 직접 확인한다',1,0,{information:2},{flag:'pressure-route'}),option('서로 물러날 교대 지점을 만든다',1,0,{support:1},{flag:'relief-posts'})],{gate:'training'}),
 scene('누가 무엇을 맡을까','broker','도움을 주겠다는 말과 실제 맡은 자리가 다릅니다. 물자와 연락의 근거를 보고 배치합니다.',[option('분배 기록대로 공동 역할을 맡긴다',0,0,{support:2},{requires:{flag:'revised-shares'},flag:'shared-final-roles'}),option('별도 예산으로 독자 전달 도구를 산다',0,20,{supplies:2},{requires:{flag:'separate-budget'},flag:'independent-final-tools'}),option('지원 없이 감당할 구간부터 직접 줄인다',3,0,{standing:1},{flag:'reduced-front'})]),
 scene('남은 물자','peer','준비한 물자를 한곳에 몰면 한 연락선이 끊길 수 있습니다. 남길 것과 쓸 것을 구별합니다.',[option('공동 인계 지점에 예비 물자를 둔다',0,10,{supplies:1,support:1},{flag:'shared-reserve'}),option('직접 점검해 고장 난 도구부터 고친다',3,0,{supplies:1},{flag:'repaired-reserve'}),option('실제 운임 기록으로 필요한 것만 조달한다',1,0,{supplies:2},{requires:{flag:'actual-costs'},flag:'lean-reserve'})]),
 scene('필요한 상대 정보','broker','도전자는 오래 쫓기보다 한 지점에서 강하게 버팁니다. 확인하지 않은 특징을 승리 약속으로 바꾸지는 않습니다.',[option('버티는 지점과 쉬는 지점을 나눠 기록한다',1,0,{information:2},{flag:'resting-posts'}),option('목격을 확인할 인력을 고용한다',0,10,{information:1},{flag:'paid-observation'})],{variants:variants(
  ['실제 단련한 몸으로 압박 구간을 짧게 확인할 수 있습니다.',option('한 번의 압박 뒤 빈 거리를 직접 확인한다',1,0,{information:2},{flag:'pressure-gap'})],
  ['완료한 의뢰의 수송 경로가 상대의 보급 지점과 겹칩니다.',option('물자의 도착 간격으로 버티는 시간을 추정한다',0,0,{information:1,supplies:1},{flag:'supply-interval'})],
  ['각자 동의한 연락선에서 서로 다른 목격이 도착했습니다.',option('다른 목격 두 개가 같은 지점을 가리키는지 본다',0,0,{information:1,support:1},{flag:'cross-witness'})])}),
 scene('마지막 협상','master','사부는 이번 일의 주도권과 하오 전체의 지위를 섞지 말라고 합니다. 지금 지킬 수 있는 조건만 제시합니다.',[option('공동 인계의 조건으로 길목을 나눈다',1,0,{support:1},{requires:{flag:'handover-terms'},flag:'negotiated-posts'}),option('협상이 깨져도 쓸 독자 경로를 직접 잇는다',3,0,{standing:1},{flag:'independent-fallback'}),option('협상 장소를 확보할 비용을 낸다',0,10,{supplies:1},{flag:'neutral-place'})]),
 scene('동시에 온 요청','peer','두 연락선이 동시에 도움을 청합니다. 무엇을 우선할지 앞서 정한 몫과 책임을 따라 결정합니다.',[option('위험 부담을 기록한 순서대로 돕는다',1,0,{standing:1},{requires:{flag:'risk-shares'},flag:'risk-priority'}),option('각자의 동의대로 인계를 나눠 맡긴다',1,0,{support:1},{requires:{flag:'renewed-consent'},flag:'consent-priority'}),option('직접 한 구간씩 잇고 지연을 알린다',3,0,{information:1},{flag:'sequential-priority'})]),
 scene('연락망을 지키는 법','broker','한 통로가 끊겼습니다. 모두를 한곳에 불러 모으거나 별도의 인계로 위험을 나눌 수 있습니다.',[option('분산된 연락으로 끊긴 부분만 바꾼다',0,0,{support:1},{requires:{flag:'distributed-contact'},flag:'distributed-repair'}),option('대체 전달자를 구해 중심 연락을 유지한다',0,20,{supplies:1},{flag:'central-repair'}),option('공개된 장소를 돌며 직접 다시 잇는다',3,0,{standing:1},{flag:'manual-repair'})]),
 scene('주도권의 대가','peer','진목은 결정을 빠르게 내린 만큼 실패의 책임도 한곳에 몰릴 수 있다고 말합니다. 남의 몫을 함부로 약속하지 않습니다.',[option('자기 이름으로 맡은 범위만 확정한다',1,0,{standing:1},{flag:'owned-liability'}),option('동의한 사람들과 책임을 나눈다',0,0,{support:1},{requires:{flag:'consented-shares'},flag:'shared-liability'})]),
 scene('각자의 몫','broker','도전자가 마지막 몫을 요구하며 길을 막습니다. 준비한 인연으로 조건을 바꾸거나 검을 겨루고, 다른 길을 만들 수도 있습니다.',[option('확인한 부담과 비용으로 요구를 반박한다',1,0,{standing:1},{requires:{resource:'information',min:5},flag:'negotiated-ending'}),option('확보한 준비로 길목의 도전자와 겨룬다',1,0,{standing:2},{battle:true,flag:'contested-ending'}),option('주도권을 포기하고 독자 연락선을 완성한다',3,0,{standing:1},{flag:'independent-ending'})],{variants:variants(
  ['실제 단련과 비무에서 확인한 압박의 빈틈에 대응할 준비가 됐습니다.',option('확인한 압박 구간을 피하며 겨룬다',1,0,{standing:2},{battle:true,flag:'prepared-ending'})],
  ['완료한 일거리의 운임과 부담이 독점 요구를 반박합니다.',option('실제 비용 기록으로 통행 조건을 다시 정한다',1,0,{standing:1},{flag:'cost-ending'})],
  ['함께 맡은 몫을 인정한 인연들이 각자의 통로를 내놓습니다.',option('동의한 통로를 이어 독점에서 벗어난다',1,0,{support:1},{flag:'coalition-ending'})])}),
 scene('강호에 남은 연락선','master','사부는 모든 인맥을 거느렸다고 축하하지 않습니다. 누구와 무엇을 이어 냈는지가 이번 생애의 역할입니다.',[option('독자 연락을 책임진 사람으로 남는다',0,0,{},{flag:'independent-role',relation:['master',1]}),option('서로 다른 몫을 조정한 사람으로 남는다',0,0,{},{flag:'coordinator-role',relation:['broker',1]})])
 ]};
export const CAMPAIGN_ARCS=[hs01,hs02,ha01,ha02];
export function withCampaign(data){const d=structuredClone(data);d.version='web-v1.8';d.campaign={version:1,stages:structuredClone(CAMPAIGN_STAGES),resources:structuredClone(CAMPAIGN_RESOURCES),arcs:structuredClone(CAMPAIGN_ARCS)};d.actions.push({id:'ACT-CAMPAIGN',name:'약속 수행',desc:'선택한 약속의 기간을 이어갑니다.',months:1,xp:0,mastery:0,tags:['campaign'],hidden:true});for(const arc of d.campaign.arcs){arc.scenes.forEach((s,i)=>{if(i===10)s.gate='foundation';if(i===15)s.gate='realm-ready';if(i===20)s.gate='readiness';s.id=arc.id+'/'+(i+1);s.stage=Math.floor(i/5);s.choices.forEach((c,j)=>c.id='choice-'+j);for(const v of s.variants??[])v.choice.id='variant-'+v.id;});d.enemies[arc.enemyKey]=structuredClone(arc.enemy);}return d;}
export function validateCampaignData(d){
 const fail=()=>{throw Error('문파 이야기 콘텐츠 오류');},text=v=>typeof v==='string'&&!!v.trim();
 if(d.version!=='web-v1.8'){if(d.campaign!==undefined||d.actions.some(a=>a.id==='ACT-CAMPAIGN'))fail();return;}
 const c=d.campaign;if(c?.version!==1||c.stages?.length!==5||!c.stages.every(text)||!Array.isArray(c.arcs)||c.arcs.length!==4||['P-HUASHAN','S-HAOMEN'].some(id=>c.arcs.filter(a=>a.origin===id).length!==2))fail();
 if(new Set(c.arcs.map(a=>a.id)).size!==c.arcs.length)fail();
 const action=d.actions.find(a=>a.id==='ACT-CAMPAIGN');if(!action?.hidden||action.xp!==0||action.mastery!==0||action.tags.join()!=='campaign')fail();
 for(const a of c.arcs){if(!['P-HUASHAN','S-HAOMEN'].includes(a.origin)||!text(a.title)||!text(a.summary)||!text(a.role)||!d.enemies[a.enemyKey]||a.scenes?.length!==25||a.npcs?.length!==3||!a.npcs.some(n=>n.id==='master')||a.npcs.some(n=>!text(n.id)||!text(n.name)||!text(n.role)))fail();
  for(const [i,s]of a.scenes.entries()){if(s.id!==a.id+'/'+(i+1)||s.stage!==Math.floor(i/5)||!text(s.title)||!text(s.text)||!a.npcs.some(n=>n.id===s.speaker)||s.choices.length<2||s.choices.length>3)fail();
   if(s.gate&&!['learning','practice','work','training','foundation','realm-ready','readiness'].includes(s.gate))fail();
   if(s.variants&&(s.choices.length!==2&&i!==23||s.variants.length!==3||new Set(s.variants.map(v=>v.id)).size!==3||s.variants.some(v=>!['training','work','bond'].includes(v.id)||!text(v.text))))fail();
   for(const o of [...s.choices,...(s.variants??[]).map(v=>v.choice)]){if(!text(o.id)||!text(o.label)||![0,1,3].includes(o.months)||![0,10,20,30].includes(o.cost)||!o.effects||Object.entries(o.effects).some(([k,n])=>!Object.hasOwn(c.resources,k)||!Number.isInteger(n)||n< -3||n>3))fail();if(o.relation&&(!a.npcs.some(n=>n.id===o.relation[0])||!Number.isInteger(o.relation[1])||Math.abs(o.relation[1])>2))fail();if(o.flag&&!text(o.flag))fail();if(o.battle&&o.months===0)fail();const r=o.requires;if(r&&!((r.flag&&text(r.flag))||(r.notFlag&&text(r.notFlag))||(Object.hasOwn(c.resources,r.resource)&&Number.isInteger(r.min)&&r.min>0)||['medicine','body','light'].includes(r.assist)))fail();}
   if(!s.choices.some(o=>!o.cost&&!o.requires&&!o.battle))fail();
  }
  for(let stage=0;stage<5;stage++)if(!a.scenes.some(s=>s.stage===stage&&s.variants))fail();
 }
}
