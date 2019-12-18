import React from 'react';
import NavPills from "util_components/NavPills";

export default class TabbedCardList extends React.Component {
  state = {activeTab: 0};

  render() {
    const {items, tabs} = this.props;
    const itemsByTab = Object.fromEntries(tabs.map(({name, filter}) => [name, items.filter(filter)]));
    let {activeTab} = this.state;

    if (!itemsByTab[tabs[activeTab].name].length)
      tabs.forEach(({name}, i) => {
        if (itemsByTab[name]) activeTab = i;
      });

    return <>
      <NavPills
        navs={tabs.map(({name}) => name)}
        active={tabs[activeTab].name}
        disabled={tabs.filter(({name}) => !itemsByTab[name].length).map(({name}) => name)}
        onSelect={(name, i) => this.setState({activeTab: i})}
      />
      <div className="mt-2">
        {itemsByTab[tabs[activeTab].name].map((item, i) =>
          <React.Fragment key={i}>{tabs[activeTab].renderItem(item)}</React.Fragment>)
        }
      </div>
    </>
  }
}
