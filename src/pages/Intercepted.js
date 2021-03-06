import React from 'react';
import { Progress, message, Icon, Row, Col, Button, Empty } from 'antd';
import { getFromStorage, setInStorage } from '../util/storage';
import {
    defaultExerciseSite,
    defaultExerciseSites,
    defaultexerciseDuration
} from '../util/constants';
import { parseUrl, setTimeout } from '../util/block-site';
import { duration } from 'moment';
import './Intercepted.css';

class Intercepted extends React.Component {
    state = {
      currentExerciseSite: '',
      timeLeft: 0,
      timestamp: new Date().getTime(),
      timer: null,
      exerciseSites: [],
      exerciseDuration: 0
    }

    componentDidMount() {
        message.open({
            content: "Let's do something useful before having fun!",
            icon: <Icon type="smile" />
        });

        this.setup();

        let timer = setInterval(() => {
            let timestamp = new Date().getTime();
            let timePassed = timestamp - this.state.timestamp;

            if (!document.hasFocus()) timePassed = 0;

            let timeLeft = this.state.timeLeft - timePassed;
            
            if (timeLeft <= 0) clearInterval(this.state.timer)

            // update time spent learning on website
            getFromStorage('timeSpentLearning').then(res => {
                let timeSpentLearning = res.timeSpentLearning || {};
                let site = this.getExerciseSite();

                if (!site) return; // not found, do not update.

                let newExerciseTimeSpent = timeSpentLearning[site.name]
                                                + timePassed || timePassed;
                timeSpentLearning[site.name] = newExerciseTimeSpent;
                return setInStorage({ timeSpentLearning });
            });

            this.setState({ timeLeft, timestamp });
        }, 1000);
        this.setState({ timer });
    }

    setup() {
        getFromStorage('intercepts', 'currentExerciseSite',
                        'exerciseSites', 'exerciseDuration').then(res => {
            let currentExerciseSite = res.currentExerciseSite || 
                defaultExerciseSite.name; // @FIXME dont assume.
            let exerciseSites = res.exerciseSites || defaultExerciseSites;
            let exerciseDuration = res.exerciseDuration || defaultexerciseDuration
            let timeLeft = exerciseDuration; // set initial time

            this.setState({ currentExerciseSite, exerciseSites,
                            exerciseDuration, timeLeft });

            let intercepts = res.intercepts || {};
            let parsed = parseUrl(this.getUrl());

            if (!parsed) return; // no url search param
            
            let count = intercepts[parsed.hostname] + 1 || 1;
            intercepts[parsed.hostname] = count;

            return setInStorage({ intercepts });
        });
    }

    getUrl() {
        let params = (new URL(window.location)).searchParams; // since chrome 51, no IE
        return params.has('url') ? params.get('url') : '';
    }

    getExerciseSite() {
        return this.state.exerciseSites.find(site => {
            return site.name === this.state.currentExerciseSite;
        });
    }

    onContinue() {
        let url = parseUrl(this.getUrl());
        let now = new Date().valueOf();

        setTimeout(url, now + this.state.exerciseDuration).then(() => {
            window.location.href = url.href;
        });
    }

    render() {
        let url = parseUrl(this.getUrl());
        let site = this.getExerciseSite();
        let progressPercentage = 100 - Math.round(
            (
                // convert to seconds first.
                Math.round(this.state.timeLeft / 1000)
                / 
                Math.round(this.state.exerciseDuration / 1000)
            ) * 100
        );

        // time left string
        let padZero = unit => unit <= 0 ? `00` : (unit < 10 ? `0${unit}` : `${unit}`);
        let timeLeftMoment = duration(this.state.timeLeft);
        let timeLeftString = `${padZero(timeLeftMoment.minutes())}:` +
                                `${padZero(timeLeftMoment.seconds())}`;

        return (
            <div>
                {site ? (
                    <iframe title="Interception page" 
                        width="100%"
                        src={site ? site.href : ''}
                        className="full-screen-iframe"
                        >
                    </iframe>
                ) : (
                    <Empty description="No exercise website"
                        style={{ height: '89vh', paddingTop: '30vh' }} />
                )}
                <div className="status-footer">
                    <Row className="status-bar">
                        <Progress 
                            percent={progressPercentage}
                            size="small"
                            showInfo={false}
                            strokeWidth={4}
                            />
                    </Row>
                    <Row
                        className="status-overlay">
                        <Col span={12} offset={4}>
                            <div>Time left: &nbsp;
                                <small>
                                    <code>{timeLeftString}</code>
                                </small>
                            </div>
                            
                            {this.state.timeLeft <= 0 &&
                                <div>Well done! You earned&nbsp;
                                {duration(this.state.exerciseDuration).humanize()}
                                &nbsp;of browsing time.</div>
                            }
                        </Col>
                        <Col span={6}>
                            <Button icon="login"
                                disabled={this.state.timeLeft > 0}
                                onClick={() => this.onContinue()}
                                >
                                Continue to {url && url.name}
                            </Button>
                        </Col>
                    </Row>
                    {/* <div style={{ backgroundColor: 'white',
                        height: '100%', width: '100%', display: 'block' }}>
                    </div> */}
                </div>
                {/* <div style={{ height: '10vh' }}>
                    <Row type="flex" justify="space-around" align="middle">
                        <Col sm={12} md={12}>
                            <h3>Time left:</h3>
                            <code>{timeLeftString}</code>
                            <Progress percent={progressPercentage} />
                            {this.state.timeLeft <= 0 &&
                                <div>Well done! You earned&nbsp;
                                {duration(this.state.exerciseDuration).humanize()}
                                &nbsp;of browsing time.</div>
                            }
                        </Col>
                        <Col sm={12} md={4}>
                            <Button icon="login"
                                disabled={this.state.timeLeft > 0}
                                onClick={() => this.onContinue()}
                                >
                                Continue to {url && url.name}
                            </Button>
                        </Col>
                    </Row>
                </div> */}
                
            </div>
        );
    }
}
export default Intercepted;