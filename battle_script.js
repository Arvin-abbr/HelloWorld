class StudentsBattle{
    constructor(){
        try {
            this.battle = JSON.parse(localStorage.getItem('battle')) || {};
            this.history = JSON.parse(localStorage.getItem('history')) || [{}];
            this.ptr = parseInt(localStorage.getItem('ptr')) || this.history.length - 1;
            this.copy = {};
        } catch(err){
            console.error(err);
            this.battle = {};
            this.history = [{}];
            this.ptr = 0;
            this.copy = {};
        }
        this.logger = new Logger(2);
        this.max_level = 2000;
        this.init();
        this.reset_ptr();
    }

    init(){
        this.cancel_event();
        this.create_students_event();
        this.delete_students_event();
        this.export_data_event();
        this.print_students();
        this.start_end_battle_event();
    }

    cancel_event(){
        const buttonNext = document.getElementById('next');
        const buttonLast = document.getElementById('last');
        buttonNext.addEventListener('click', () =>{
            if (this.ptr + 1 < this.history.length) {
                this.ptr++;
                this.reset_ptr();
            }
        })

        buttonLast.addEventListener('click', () =>{
            if (this.ptr >= 1){
                this.ptr--;
                this.reset_ptr();
            }
        })
    }

    create_students_event() {
        // 创建学生
        const createButton = document.getElementById("create-students");
        createButton.addEventListener("click", () => {
            const student = document.getElementById('student').value;
            const studentHp = parseInt(document.getElementById('student-hp').value);
            if (!studentHp || !student || studentHp <= 0) {
                alert("输入错误!");
            } else {
                let success = this.create_students(student, studentHp);
                alert(success ? '添加成功!': '添加过程中出错.');
            }
        })
    }

    create_students(stu, hp) {
        try{
            this.copy = Object.assign({}, this.battle);
            this.copy[stu] = {'hp': hp, 'status': '无', 'total': hp, 'attack': 0,
                'score_change': 0, 'keep_attack': 0, 'rounds': 0};
            this.battle = this.copy;
            localStorage.setItem('battle', JSON.stringify(this.battle));
            this.print_students();
            this.update_history();
            return true;
        }catch(err) {
            console.error(err);
            return false;
        }
    }

    cut_down(reset=false){
        // 倒计时效果
        const circles = document.getElementsByClassName('circle');
        if (reset) {
            for (let i = 0; i < 3; i++) circles[i].style.backgroundColor = 'grey';
            return;
        }
        let second = 0;
        const timer = setInterval(() => {
            second++;
            if (second === 17){
                for (let i = 0; i < 3; i++) circles[i].style.backgroundColor = 'greenyellow';
                clearInterval(timer);
            } else if (second >= 14){
                circles[second - 14].style.backgroundColor = 'yellow';
            }
        }, 1000)
        // 如果停止就重置
    }

    delete_students_event() {
        const deleteButton = document.getElementById("delete");
        deleteButton.addEventListener("click", () => {
            const selectStudent = document.getElementById("select-students").value;
            this.copy = Object.assign({}, this.battle);
            delete this.copy[selectStudent];
            this.battle = this.copy;
            localStorage.setItem('battle', JSON.stringify(this.battle));
            alert(`${selectStudent}已被删除.`);
            this.print_students();
            this.update_history();
        })
    }

    export_data(object, file) {
        try {
            let jsonString = JSON.stringify(object);
            const blob = new Blob([jsonString], {
                type: "application/json;charset=utf-8"
            });

            const link = document.createElement('a');
            const href = URL.createObjectURL(blob)
            link.style.display = 'none';
            link.download = file;
            link.href = href;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(href);
        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    }

    export_data_event() {
        const exportButton = document.getElementById("export-data");
        exportButton.addEventListener("click", () => {
            let success = this.export_data(this.battle, 'battle.json');
            alert(success ? '导出成功!' : '导出失败');
        })
    }

    get_color(hp){
        let color;
        if (hp >= 80) color = 'green';
        else if (hp >= 40) color = 'orange';
        else if (hp >= 20) color = '#df5d17';
        else color = 'red';
        return color;
    }

    get_other_rows(name, hp, stat, tot, perc, atk, color, change, keep, rounds){
        return `
        <tr>
            <th><span style="color: #888800">${name}</span></th>
            <td><span style="color:${color}">
                           ${hp > 0 ? hp : 0}</span></td>
            <td><meter min="0" max="100"
                low="20" high="80" optimum="90" value="${perc}">
            </meter><span>${perc > 0 ? perc : 0}%</span></td>
            <td><span style="color: ${change >= 0 ? 'green' : 'red'}">
                ${change > 0 ? '+' : ' '}${change}</span></td>
            <td><span style="color: #3700ff">${keep}</span></td>
            <td><span style="color: deeppink">${rounds}</span></td>
            <td>${stat}</td>
            <td>Level${atk <= 15 * (this.max_level - 1) ? 
                        Math.floor(atk / 15) + 1 : this.max_level}</td>
        </tr>`;
    }

    get_first_row(){
        return `<tr>
                <th scope="col">姓名</th>
                <th scope="col">生命值</th>
                <th scope="col">血条</th>
                <th scope="col">生命加减</th>
                <th scope="col">连击次数</th>
                <th scope="col">坚持轮数</th>
                <th scope="col">当前状态</th>           
                <th scope="col">等级</th>
            </tr>`;
    }

    print_students() {
        const battleTableBody = document.getElementById("table-tbody");
        const selectElement = document.getElementById("select-students") || undefined;

        battleTableBody.innerHTML = this.get_first_row()
        if (selectElement) selectElement.innerHTML = ``;

        Object.keys(this.battle).forEach(key => {
            let obj = this.battle[key];
            let hp = obj['hp'];
            let status = obj['status'];
            let total = obj['total'];
            let percent = Math.round(hp / total * 100);
            let attack = obj['attack'];
            let color = this.get_color(percent);
            let change = obj['score_change'];
            let keep = obj['keep_attack'];
            let rounds = obj['rounds'];
            // table 内嵌span元素
            battleTableBody.innerHTML += this.get_other_rows(
                key, hp, status, total, percent, attack, color, change, keep, rounds);
            // 防止代码崩掉
            if (selectElement)
                selectElement.innerHTML += `<option value="${key}">${key}</option>`;
        });
    }

    reset_ptr(){
        this.battle = this.history[this.ptr];
        this.print_students();
        localStorage.setItem('ptr', this.ptr.toString());
    }

    _audioPlay() {
        document.body.style.background = 'url("43c637907fd97728b269714a7738381f%20(1).jpeg")';
        const audio = document.querySelector('audio');
        audio.currentTime = 0;
        audio.play();
    }

    _audioPause() {
        const audio = document.querySelector('audio');
        audio.pause();
        document.body.style.background = 'linear-gradient(135deg, #c6d8e7, #b4c3e8)';
    }

    _battle(interval, timer, list, end, status, stop) {
        this._executeBattleRound(status);
        if (stop) {
            this._stopBattle(interval, timer, list, end, status);
            return;
        }
        if (Object.keys(this.battle).length < 2) {
            this._stopBattle(interval, timer, list, end, status);
        }
    }

    _battleOver(buttonList, endBattleButton, battleStatus) {
        this._audioPause();
        alert('战斗结束!');

        for (let b of buttonList) {
            b.disabled = false;
        }
        endBattleButton.disabled = true;
        battleStatus.textContent = '战斗已结束';
        battleStatus.style.color = 'grey';
        battleStatus.style.fontWeight = 'normal';
    }

    _randint(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    _randChoice(arr) {
        return arr[this._randint(0, arr.length - 1)];
    }

    _executeBattleRound() {
        let students = Object.keys(this.battle);

        // 攻击与被攻击学生
        let attack_student = this._randChoice(students);
        students.splice(students.indexOf(attack_student), 1);
        let is_attacked_student = this._randChoice(students);
        let atk = this.battle[attack_student]['attack'];
        let level = atk <= 15 * (this.max_level - 1) ? atk / 15 + 1 : this.max_level;
        let super_atk = !this._randint(0, 300) ? 15 : 1;
        let hp_val = Math.round(this._randint(5, 10) + 4 * level) * super_atk;
        let obj1 = this.battle[is_attacked_student];
        let obj2 = this.battle[attack_student];

        // 攻击处理
        obj1['hp'] -= hp_val;
        obj1['score_change'] = -hp_val;
        obj1['status'] = `${super_atk === 15 ? '💥大招' : ''}被${attack_student}攻击`;
        obj1['keep_attack'] = 0;
        obj2['status'] = `攻击${is_attacked_student}`;
        obj2['attack'] += super_atk;
        obj2['keep_attack'] += super_atk;

        if (super_atk === 15) {
            this.logger.super_atk(attack_student, is_attacked_student, hp_val);
        }

        // 加分机制
        let plus = Math.round(obj2['keep_attack'] * this._randint(3, 4) * (level / 15 + 1));
        if (obj2['attack'] && obj2['attack'] % 15 === 0 && obj2['attack'] / 15 <= this.max_level) {
            plus += Math.round(this._randint(30, 50) * (level / 5 + 1));
            this.logger.update_level(attack_student, level);
        }

        obj2['hp'] += plus;
        obj2['score_change'] = plus;
        if (obj2['hp'] > obj2['total']) obj2['hp'] = obj2['total'];

        // 更新轮数
        Object.keys(this.battle).forEach((key) => {
            if (key !== is_attacked_student) {
                this.battle[key]['rounds']++;
            }
        });
        // 检查是否被击败
        if (obj1['hp'] <= 0) {
            this.logger.dead(is_attacked_student, obj1);
            delete this.battle[is_attacked_student];
            this.print_students();
        }

        obj1['rounds']++;
        this.print_students();
    }

    _stopBattle(interval, timer, buttonList, endBattleButton, battleStatus) {
        clearInterval(interval);
        clearTimeout(timer);
        this.cut_down(true);
        this._battleOver(buttonList, endBattleButton, battleStatus);
    }

    start_end_battle_event(){
        const startBattleButton = document.getElementById("start-battle");
        const endBattleButton = document.getElementById("end-battle");
        const battle_status = document.getElementById("battle-status");
        const buttonList = document.querySelectorAll('button');
        const delay = 17000;
        let stop = true;
        let battleInterval = null;
        let battleTimer = null;

        startBattleButton.addEventListener("click", () =>{
            stop = false;
            const round_delay = parseInt(document.getElementById('round_delay').value);
            const checkedVal = document.querySelector('input[type="radio"]:checked').value;
            this.cut_down();

            if (Object.keys(this.battle).length < 2) {
                alert('人数小于两人, 不能开战.');
                return;
            }
            // 禁用所有按钮
            for (let b of buttonList) {
                b.disabled = true;
            }
            this._audioPlay();
            battle_status.textContent = '战斗开始!!!';
            battle_status.style.color = 'red';
            battle_status.style.fontWeight = 'bold';

            battleTimer = setTimeout(() => {
                endBattleButton.disabled = false;
                if (checkedVal === "auto"){
                    battleInterval = setInterval(() => {
                        this._battle(
                            battleInterval, battleTimer, buttonList, endBattleButton, battle_status, stop
                        );
                    }, round_delay);
                }else {
                    document.addEventListener('keydown', (e) => {
                        if (e.code === 'Space') {
                            e.preventDefault();
                            this._battle(
                                battleInterval, battleTimer, buttonList, endBattleButton, battle_status, stop
                            );
                        }
                    });
                }
            }, delay);
        });

        endBattleButton.addEventListener("click", () =>{
            stop = true;
        });
    }

    update_history(){
        this.history.push(this.copy);
        this.ptr = this.history.length - 1;
        localStorage.setItem('ptr', this.ptr.toString());
        localStorage.setItem('history', JSON.stringify(this.history));
        console.log(this.history);
    }
}

class Logger {
    constructor(level) {
        this.logInfo = document.getElementById('log-info');
        this.level = level;
    }

    // reset() {
    //     this.logInfo.innerHTML = '';
    // }

    dead(is_atk, obj) {
        if (this.level >= 4) return;
        this.logInfo.innerHTML +=
            `${new Date().toTimeString()} [被击败]${is_atk}被击败了, 坚持了${obj['rounds']}轮.\n`;
    }

    super_atk(atk, is_atk, hp) {
        if (this.level >= 4) return;
        this.logInfo.innerHTML +=
            `${new Date().toTimeString()} [大招]${atk}放大招, 使${is_atk}减少了${hp}生命值\n`;
    }

    update_level(atk, level) {
        if (this.level >= 3) return;
        this.logInfo.innerHTML +=
            `${new Date().toTimeString()} [升级]${atk}升至${Math.ceil(level)}级\n`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    new StudentsBattle();
});